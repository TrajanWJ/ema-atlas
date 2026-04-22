import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFile, writeFile, readdir, unlink, appendFile, stat } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { execFile, exec as execCb } from 'child_process';
import { fileURLToPath } from 'url';

// --- SQLite-backed route modules ---
import tasksRouter from './routes/tasks.js';
import agentsRouter from './routes/agents.js';
import feedRouter from './routes/feed.js';
import missionsRouter from './routes/missions.js';
import proposalsRouter from './routes/proposals.js';
import inboxRouter from './routes/inbox.js';
import handoffsRouter from './routes/handoffs.js';
import dispatchRouter from './routes/dispatch-cmd.js';
import systemRouter from './routes/system.js';

// --- Wiki API proxy routes ---
import wikiRouter, { getWikiHealth, wikiSearch } from './routes/wiki.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const PORT = parseInt(process.env.PORT || '18790', 10);
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://127.0.0.1:18789';
const AUTH_TOKEN = process.env.OPENCLAW_GATEWAY_PASSWORD || process.env.OPENCLAW_GATEWAY_TOKEN || '';
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const DISCORD_API = 'https://discord.com/api/v10';
const DISPATCH = join(process.env.HOME, 'dispatch');
const CHANNEL_IDS_PATH = join(DISPATCH, 'channel-ids.json');
const QUEUE_DIR = join(DISPATCH, 'queue');
const DONE_DIR = join(DISPATCH, 'done');
const FEED_PATH = join(DISPATCH, 'feed.jsonl');
const ANSWERS_PATH = join(DISPATCH, 'answers.jsonl');
const POLL_INTERVAL_MS = 5000; // 5s — balances real-time feel vs Discord rate limits (20 channels)

// Ensure dirs exist
for (const dir of [QUEUE_DIR, DONE_DIR]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();

app.use(express.json());
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // allow non-browser (curl, etc.)
    if (
      origin.startsWith('http://localhost') ||
      origin.startsWith('https://trajanwj.github.io') ||
      /^http:\/\/192\.168\.122\.\d{1,3}(:\d+)?$/.test(origin)
    ) {
      return cb(null, true);
    }
    cb(new Error('CORS not allowed'));
  }
}));

// ---------------------------------------------------------------------------
// Static frontend — serve demo pages if present (same origin = no CORS/auth needed)
// ---------------------------------------------------------------------------
const DEMO_DIR = process.env.DEMO_DIR || join(dirname(fileURLToPath(import.meta.url)), '..', 'agent-os-demo-pages');
if (existsSync(DEMO_DIR)) {
  app.use('/app', express.static(DEMO_DIR));
  app.get('/', (_req, res) => res.redirect('/app/'));
  console.log(`[bridge] Serving frontend at /app from ${DEMO_DIR}`);
}

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------
function requireAuth(req, res, next) {
  if (!AUTH_TOKEN) return next(); // no token configured = open (dev mode)
  // Allow same-origin requests from /app (served by this bridge)
  const referer = req.headers.referer || '';
  const origin = req.headers.origin || '';
  if (referer.includes('/app') || origin.includes('localhost') || origin.includes('192.168.122.')) {
    return next();
  }
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }
  const provided = header.slice(7);
  // Accept either the gateway password or the gateway token
  const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || '';
  if (provided !== AUTH_TOKEN && provided !== GATEWAY_TOKEN) {
    return res.status(403).json({ error: 'Invalid token' });
  }
  next();
}

app.use('/api', requireAuth);

// === NEW SQLite-backed API routes ===
app.use('/api/tasks', tasksRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/feed', feedRouter);
app.use('/api/missions', missionsRouter);
app.use('/api/proposals', proposalsRouter);
app.use('/api/inbox', inboxRouter);
app.use('/api/handoffs', handoffsRouter);
app.use('/api/dispatch', dispatchRouter);
app.use('/api/system', systemRouter);

// === Wiki API routes (new native endpoints) ===
app.use('/api/wiki', wikiRouter);

// === Vault backward-compat aliases → wiki ===
// These preserve vault endpoint contracts but serve wiki data
app.get('/api/vault/search', (req, res, next) => {
  req.url = '/vault-search' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
  wikiRouter.handle(req, res, next);
});
// /api/vault/note — handled in wiki router as /vault-note
app.get('/api/vault/note', (req, res, next) => {
  req.url = '/vault-note' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
  wikiRouter.handle(req, res, next);
});
// /api/vault/recent and /api/vault/stats are overridden below the existing definitions
// (existing handlers remain active for file-based fallback; wiki aliases registered after)

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Gateway proxy helper
// ---------------------------------------------------------------------------
async function invokeGateway(tool, args) {
  const resp = await fetch(`${GATEWAY_URL}/tools/invoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
    },
    body: JSON.stringify({ tool, args }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Gateway error ${resp.status}: ${text}`);
  }
  return resp.json();
}

// ---------------------------------------------------------------------------
// Discord Message Proxy
// ---------------------------------------------------------------------------

// GET /api/channels — returns categorized channel list from Discord
app.get('/api/channels', async (req, res, next) => {
  try {
    const guildId = process.env.DISCORD_GUILD_ID || '1482230800916287710';
    const allChannels = await discordFetch(`/guilds/${guildId}/channels`);
    
    // Separate categories and channels
    const categories = allChannels
      .filter(c => c.type === 4) // GUILD_CATEGORY
      .sort((a, b) => a.position - b.position);
    
    const channels = allChannels
      .filter(c => c.type !== 4)
      .sort((a, b) => a.position - b.position);
    
    // Build categorized structure matching DC_CHANNELS format
    const result = {
      categories: categories
        .filter(cat => !cat.name.startsWith('_')) // skip _ARCHIVE etc.
        .map(cat => ({
          id: cat.id,
          name: cat.name,
          channels: channels
            .filter(ch => ch.parent_id === cat.id)
            .map(ch => ({
              id: ch.id,
              name: ch.name,
              type: ch.type === 0 ? 'text' : ch.type === 2 ? 'voice' : ch.type === 15 ? 'forum' : 'text',
              topic: ch.topic || '',
              unread: 0, // Would need tracking
            }))
        })),
      // Flat list for backward compat
      flat: channels
        .filter(ch => ch.type === 0 || ch.type === 15)
        .map(ch => ({
          id: ch.id,
          name: ch.name,
          type: ch.type === 15 ? 'forum' : 'text',
          topic: ch.topic || '',
        })),
    };
    
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Discord API helpers (direct, bypasses gateway SecretRef issues)
// ---------------------------------------------------------------------------
async function discordFetch(path, options = {}, _retries = 0) {
  const resp = await fetch(`${DISCORD_API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (resp.status === 429 && _retries < 3) {
    const body = await resp.json().catch(() => ({}));
    const wait = (body.retry_after || 1) * 1000;
    console.log(`[rate-limit] ${path} — waiting ${wait}ms (retry ${_retries + 1})`);
    await new Promise(r => setTimeout(r, wait));
    return discordFetch(path, options, _retries + 1);
  }
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Discord API error ${resp.status}: ${text}`);
  }
  return resp.json();
}

// GET /api/channels/:id/messages
app.get('/api/channels/:id/messages', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const before = req.query.before || '';
    const params = new URLSearchParams({ limit: String(limit) });
    if (before) params.set('before', before);
    
    const messages = await discordFetch(`/channels/${req.params.id}/messages?${params}`);
    
    // Normalize to a consistent format
    const normalized = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      author: {
        id: msg.author.id,
        username: msg.author.username,
        display_name: msg.author.global_name || msg.author.username,
        avatar: msg.author.avatar,
        bot: msg.author.bot || false,
      },
      timestamp: msg.timestamp,
      edited_timestamp: msg.edited_timestamp,
      attachments: msg.attachments || [],
      embeds: msg.embeds || [],
      reactions: (msg.reactions || []).map(r => ({
        emoji: r.emoji.name,
        count: r.count,
      })),
      referenced_message: msg.referenced_message ? {
        id: msg.referenced_message.id,
        content: msg.referenced_message.content?.substring(0, 100),
        author: msg.referenced_message.author?.username,
      } : null,
      thread: msg.thread ? { id: msg.thread.id, name: msg.thread.name } : null,
    }));
    
    res.json(normalized);
  } catch (err) {
    next(err);
  }
});

// POST /api/channels/:id/messages
app.post('/api/channels/:id/messages', async (req, res, next) => {
  try {
    const { message, reply_to } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message field required (string)' });
    }
    
    const body = { content: message };
    if (reply_to) {
      body.message_reference = { message_id: reply_to };
    }
    
    const data = await discordFetch(`/channels/${req.params.id}/messages`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    // Update lastMessageIds so poll doesn't re-broadcast this message
    lastMessageIds.set(req.params.id, data.id);

    // Broadcast to all connected WebSocket clients immediately
    broadcast({
      type: 'message',
      channel: req.params.id,
      data: {
        id: data.id,
        content: data.content,
        author: {
          id: data.author.id,
          username: data.author.username,
          display_name: data.author.global_name || data.author.username,
          avatar: data.author.avatar,
          bot: data.author.bot || false,
        },
        timestamp: data.timestamp,
        attachments: data.attachments || [],
        embeds: data.embeds || [],
        reactions: [],
        referenced_message: data.referenced_message ? {
          id: data.referenced_message.id,
          content: data.referenced_message.content?.substring(0, 100),
          author: data.referenced_message.author?.username,
        } : null,
      },
      source: 'self', // So client can identify its own messages
    });

    // Log to answers.jsonl
    const entry = {
      id: data.id,
      channel_id: req.params.id,
      message,
      timestamp: new Date().toISOString(),
      reply_to: reply_to || null,
    };
    await appendJsonl(ANSWERS_PATH, entry);

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Discord: Reactions, Threads, Guild Info, Typing
// ---------------------------------------------------------------------------

// POST /api/channels/:id/messages/:msgId/react — add a reaction
app.post('/api/channels/:id/messages/:msgId/react', async (req, res, next) => {
  try {
    const { emoji } = req.body;
    if (!emoji || typeof emoji !== 'string') {
      return res.status(400).json({ error: 'emoji field required (string)' });
    }
    // URL-encode the emoji for the path (Unicode emojis need encoding)
    const encoded = encodeURIComponent(emoji);
    const resp = await fetch(`${DISCORD_API}/channels/${req.params.id}/messages/${req.params.msgId}/reactions/${encoded}/@me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    if (resp.status === 429) {
      const body = await resp.json().catch(() => ({}));
      return res.status(429).json({ error: 'Rate limited', retry_after: body.retry_after });
    }
    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: `Discord API error: ${text}` });
    }
    // Discord returns 204 No Content on success
    res.json({ ok: true, emoji, message_id: req.params.msgId });
  } catch (err) {
    next(err);
  }
});

// GET /api/channels/:id/threads — list active threads in a channel
app.get('/api/channels/:id/threads', async (req, res, next) => {
  try {
    // Discord: GET /channels/{channel.id}/threads/archived/public for archived,
    // but for active threads we use the guild endpoint filtered by parent
    const guildId = process.env.DISCORD_GUILD_ID || '1482230800916287710';
    const data = await discordFetch(`/guilds/${guildId}/threads/active`);
    const threads = (data.threads || [])
      .filter(t => t.parent_id === req.params.id)
      .map(t => ({
        id: t.id,
        name: t.name,
        parent_id: t.parent_id,
        owner_id: t.owner_id,
        message_count: t.message_count || 0,
        member_count: t.member_count || 0,
        archived: t.thread_metadata?.archived || false,
        auto_archive_duration: t.thread_metadata?.auto_archive_duration || 1440,
        created_at: t.thread_metadata?.create_timestamp || null,
        last_message_id: t.last_message_id || null,
      }));

    // Also fetch recently archived threads
    try {
      const archived = await discordFetch(`/channels/${req.params.id}/threads/archived/public?limit=25`);
      (archived.threads || []).forEach(t => {
        threads.push({
          id: t.id,
          name: t.name,
          parent_id: t.parent_id,
          owner_id: t.owner_id,
          message_count: t.message_count || 0,
          member_count: t.member_count || 0,
          archived: true,
          auto_archive_duration: t.thread_metadata?.auto_archive_duration || 1440,
          created_at: t.thread_metadata?.create_timestamp || null,
          last_message_id: t.last_message_id || null,
        });
      });
    } catch { /* archived fetch may fail, that's ok */ }

    res.json(threads);
  } catch (err) {
    next(err);
  }
});

// GET /api/threads/:id/messages — read messages from a thread
app.get('/api/threads/:id/messages', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const before = req.query.before || '';
    const params = new URLSearchParams({ limit: String(limit) });
    if (before) params.set('before', before);

    // Threads are channels in Discord's API
    const messages = await discordFetch(`/channels/${req.params.id}/messages?${params}`);
    const normalized = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      author: {
        id: msg.author.id,
        username: msg.author.username,
        display_name: msg.author.global_name || msg.author.username,
        avatar: msg.author.avatar,
        bot: msg.author.bot || false,
      },
      timestamp: msg.timestamp,
      edited_timestamp: msg.edited_timestamp,
      attachments: msg.attachments || [],
      embeds: msg.embeds || [],
      reactions: (msg.reactions || []).map(r => ({
        emoji: r.emoji.name,
        count: r.count,
      })),
      referenced_message: msg.referenced_message ? {
        id: msg.referenced_message.id,
        content: msg.referenced_message.content?.substring(0, 100),
        author: msg.referenced_message.author?.username,
      } : null,
    }));

    res.json(normalized);
  } catch (err) {
    next(err);
  }
});

// POST /api/threads/:id/messages — reply to a thread
app.post('/api/threads/:id/messages', async (req, res, next) => {
  try {
    const { content, message, reply_to } = req.body;
    const text = content || message;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'content or message field required (string)' });
    }

    const body = { content: text };
    if (reply_to) {
      body.message_reference = { message_id: reply_to };
    }

    // Threads are channels in Discord's API
    const data = await discordFetch(`/channels/${req.params.id}/messages`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    broadcast({
      type: 'thread_message',
      thread: req.params.id,
      data: {
        id: data.id,
        content: data.content,
        author: {
          id: data.author.id,
          username: data.author.username,
          display_name: data.author.global_name || data.author.username,
          avatar: data.author.avatar,
          bot: data.author.bot || false,
        },
        timestamp: data.timestamp,
        attachments: data.attachments || [],
        embeds: data.embeds || [],
        reactions: [],
      },
      source: 'self',
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/guild/info — guild overview
app.get('/api/guild/info', async (_req, res, next) => {
  try {
    const guildId = process.env.DISCORD_GUILD_ID || '1482230800916287710';
    const guild = await discordFetch(`/guilds/${guildId}?with_counts=true`);
    res.json({
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
      description: guild.description || '',
      member_count: guild.approximate_member_count || 0,
      online_count: guild.approximate_presence_count || 0,
      channel_count: 0, // filled below
      role_count: (guild.roles || []).length,
      emoji_count: (guild.emojis || []).length,
      boost_level: guild.premium_tier || 0,
      boost_count: guild.premium_subscription_count || 0,
      owner_id: guild.owner_id,
      created_at: guild.id ? new Date(Number(BigInt(guild.id) >> 22n) + 1420070400000).toISOString() : null,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/guild/channels — full channel tree with categories
app.get('/api/guild/channels', async (_req, res, next) => {
  try {
    const guildId = process.env.DISCORD_GUILD_ID || '1482230800916287710';
    const allChannels = await discordFetch(`/guilds/${guildId}/channels`);

    const TYPE_NAMES = { 0: 'text', 2: 'voice', 4: 'category', 5: 'announcement', 13: 'stage', 15: 'forum' };
    const categories = allChannels
      .filter(c => c.type === 4)
      .sort((a, b) => a.position - b.position)
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        position: cat.position,
        channels: allChannels
          .filter(ch => ch.parent_id === cat.id)
          .sort((a, b) => a.position - b.position)
          .map(ch => ({
            id: ch.id,
            name: ch.name,
            type: TYPE_NAMES[ch.type] || 'unknown',
            position: ch.position,
            topic: ch.topic || '',
            nsfw: ch.nsfw || false,
          })),
      }));

    // Uncategorized channels (no parent)
    const uncategorized = allChannels
      .filter(ch => ch.type !== 4 && !ch.parent_id)
      .sort((a, b) => a.position - b.position)
      .map(ch => ({
        id: ch.id,
        name: ch.name,
        type: TYPE_NAMES[ch.type] || 'unknown',
        position: ch.position,
        topic: ch.topic || '',
        nsfw: ch.nsfw || false,
      }));

    res.json({
      categories,
      uncategorized,
      total: allChannels.length,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/channels/:id/typing — show typing indicator
app.post('/api/channels/:id/typing', async (req, res, next) => {
  try {
    const resp = await fetch(`${DISCORD_API}/channels/${req.params.id}/typing`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
      },
    });
    if (resp.status === 429) {
      const body = await resp.json().catch(() => ({}));
      return res.status(429).json({ error: 'Rate limited', retry_after: body.retry_after });
    }
    if (!resp.ok && resp.status !== 204) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: `Discord API error: ${text}` });
    }
    // Discord returns 204 No Content on success
    res.json({ ok: true, channel_id: req.params.id });
  } catch (err) {
    next(err);
  }
});

// PUT /api/channels/:id/topic — update a channel's topic
app.put('/api/channels/:id/topic', async (req, res, next) => {
  try {
    const { topic } = req.body;
    if (topic == null || typeof topic !== 'string') {
      return res.status(400).json({ error: 'topic field required (string)' });
    }
    const data = await discordFetch(`/channels/${req.params.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ topic }),
    });
    res.json({ ok: true, channel_id: req.params.id, topic: data.topic || topic });
  } catch (err) {
    next(err);
  }
});

// GET /api/channels/:id/pins — get pinned messages for a channel
app.get('/api/channels/:id/pins', async (req, res, next) => {
  try {
    const messages = await discordFetch(`/channels/${req.params.id}/pins`);
    const normalized = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      author: {
        id: msg.author.id,
        username: msg.author.username,
        display_name: msg.author.global_name || msg.author.username,
        avatar: msg.author.avatar,
        bot: msg.author.bot || false,
      },
      timestamp: msg.timestamp,
      attachments: msg.attachments || [],
      embeds: msg.embeds || [],
    }));
    res.json(normalized);
  } catch (err) {
    next(err);
  }
});

// GET /api/channels/:id/info — channel metadata + stats
app.get('/api/channels/:id/info', async (req, res, next) => {
  try {
    const channel = await discordFetch(`/channels/${req.params.id}`);
    
    // Get pinned count
    let pinnedCount = 0;
    try {
      const pins = await discordFetch(`/channels/${req.params.id}/pins`);
      pinnedCount = Array.isArray(pins) ? pins.length : 0;
    } catch { /* pins fetch may fail */ }

    // Get recent message count (last 24h approximation via last 100 messages)
    let recentMessageCount = 0;
    let lastMessageTime = null;
    try {
      const msgs = await discordFetch(`/channels/${req.params.id}/messages?limit=100`);
      if (Array.isArray(msgs) && msgs.length > 0) {
        lastMessageTime = msgs[0].timestamp;
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        recentMessageCount = msgs.filter(m => new Date(m.timestamp).getTime() > cutoff).length;
      }
    } catch { /* messages fetch may fail */ }

    // Created date from snowflake ID
    const createdTimestamp = Number(BigInt(req.params.id) >> 22n) + 1420070400000;

    // Member count (approximate from guild)
    let memberCount = 0;
    try {
      const guildId = process.env.DISCORD_GUILD_ID || '1482230800916287710';
      const guild = await discordFetch(`/guilds/${guildId}?with_counts=true`);
      memberCount = guild.approximate_member_count || 0;
    } catch { /* guild fetch may fail */ }

    res.json({
      id: channel.id,
      name: channel.name,
      topic: channel.topic || '',
      type: channel.type,
      nsfw: channel.nsfw || false,
      position: channel.position,
      parent_id: channel.parent_id,
      created_at: new Date(createdTimestamp).toISOString(),
      last_message_time: lastMessageTime,
      pinned_count: pinnedCount,
      recent_messages_24h: recentMessageCount,
      member_count: memberCount,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Queue API
// ---------------------------------------------------------------------------

async function readQueueIndex() {
  try {
    const raw = await readFile(join(QUEUE_DIR, 'index.json'), 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeQueueIndex(items) {
  await writeFile(join(QUEUE_DIR, 'index.json'), JSON.stringify(items, null, 2));
}

async function rebuildQueueIndex() {
  const files = await readdir(QUEUE_DIR);
  const items = [];
  for (const f of files) {
    if (f === 'index.json' || !f.endsWith('.json')) continue;
    try {
      const raw = await readFile(join(QUEUE_DIR, f), 'utf8');
      const item = JSON.parse(raw);
      items.push(item);
    } catch { /* skip corrupt files */ }
  }
  items.sort((a, b) => {
    const pa = (a.priority || 'P9').replace('P', '');
    const pb = (b.priority || 'P9').replace('P', '');
    if (pa !== pb) return parseInt(pa) - parseInt(pb);
    return (a.created_at || '').localeCompare(b.created_at || '');
  });
  await writeQueueIndex(items);
  return items;
}

// REPLACED BY routes/*.js — kept for reference {{{
// // GET /api/queue
// app.get('/api/queue', async (_req, res, next) => {
//   try {
//     let items = await readQueueIndex();
//     if (items.length === 0) {
//       items = await rebuildQueueIndex();
//     }
//     res.json(items);
//   } catch (err) {
//     next(err);
//   }
// });
// }}} END REPLACED BY routes/*.js

// REPLACED BY routes/*.js — kept for reference {{{
// // GET /api/queue/history
// app.get('/api/queue/history', async (_req, res, next) => {
//   try {
//     const files = await readdir(DONE_DIR);
//     const jsonFiles = files.filter(f => f.endsWith('.json'));
//     const items = [];
//     for (const f of jsonFiles) {
//       try {
//         const raw = await readFile(join(DONE_DIR, f), 'utf8');
//         items.push(JSON.parse(raw));
//       } catch { /* skip */ }
//     }
//     items.sort((a, b) => (b.resolved_at || '').localeCompare(a.resolved_at || ''));
//     res.json(items.slice(0, 50));
//   } catch (err) {
//     next(err);
//   }
// });
// }}} END REPLACED BY routes/*.js

// REPLACED BY routes/*.js — kept for reference {{{
// // GET /api/queue/:id
// app.get('/api/queue/:id', async (req, res, next) => {
//   try {
//     const filePath = join(QUEUE_DIR, `${req.params.id}.json`);
//     const raw = await readFile(filePath, 'utf8');
//     res.json(JSON.parse(raw));
//   } catch (err) {
//     if (err.code === 'ENOENT') {
//       return res.status(404).json({ error: 'Queue item not found' });
//     }
//     next(err);
//   }
// });
// }}} END REPLACED BY routes/*.js

// REPLACED BY routes/*.js — kept for reference {{{
// // POST /api/queue/:id/resolve
// app.post('/api/queue/:id/resolve', async (req, res, next) => {
//   try {
//     const { status, resolution } = req.body;
//     if (!['approved', 'rejected', 'deferred'].includes(status)) {
//       return res.status(400).json({ error: 'status must be approved, rejected, or deferred' });
//     }

//     const srcPath = join(QUEUE_DIR, `${req.params.id}.json`);
//     const dstPath = join(DONE_DIR, `${req.params.id}.json`);

//     let item;
//     try {
//       const raw = await readFile(srcPath, 'utf8');
//       item = JSON.parse(raw);
//     } catch (err) {
//       if (err.code === 'ENOENT') {
//         return res.status(404).json({ error: 'Queue item not found' });
//       }
//       throw err;
//     }

//     item.status = status;
//     item.resolution = resolution || '';
//     item.resolved_at = new Date().toISOString();

//     await writeFile(dstPath, JSON.stringify(item, null, 2));
//     await unlink(srcPath).catch(() => {});

//     await rebuildQueueIndex();

//     broadcast({ type: 'queue', action: 'resolved', data: item });
//     res.json(item);
//   } catch (err) {
//     next(err);
//   }
// });
// }}} END REPLACED BY routes/*.js

// ---------------------------------------------------------------------------
// Proposals API
// ---------------------------------------------------------------------------
const PROPOSALS_DIR = join(process.env.HOME, 'dispatch', 'proposals');
if (!existsSync(PROPOSALS_DIR)) mkdirSync(PROPOSALS_DIR, { recursive: true });

// REPLACED BY routes/*.js — kept for reference {{{
// // POST /api/proposals — create a new proposal (from any source: UI, agent, webhook)
// app.post('/api/proposals', async (req, res, next) => {
//   try {
//     const { type, title, body, priority, source, options } = req.body;
//     if (!title) return res.status(400).json({ error: 'title required' });
    
//     const { execSync } = await import('child_process');
//     const proposalSh = join(process.env.HOME, 'bin', 'proposal.sh');
    
//     let cmd = `${proposalSh} create --type "${type || 'idea'}" --title "${title.replace(/"/g, '\\"')}" --body "${(body || '').replace(/"/g, '\\"')}" --priority "${priority || 'P3'}" --source "${source || 'api'}"`;
    
//     const output = execSync(cmd, { timeout: 10000, encoding: 'utf8' });
    
//     // Extract created ID from output
//     const idMatch = output.match(/(prop-\S+)/);
//     const id = idMatch ? idMatch[1] : null;
    
//     if (id) {
//       // Wait a moment for background triage to complete
//       await new Promise(r => setTimeout(r, 1500));
//       const filePath = join(PROPOSALS_DIR, `${id}.json`);
//       const raw = await readFile(filePath, 'utf8');
//       const item = JSON.parse(raw);
//       broadcast({ type: 'proposal', action: item.triage_verdict || 'new', data: item });
//       res.status(201).json(item);
//     } else {
//       // Might be dedup
//       res.json({ status: 'skipped', message: output.trim() });
//     }
//   } catch (err) {
//     next(err);
//   }
// });
// }}} END REPLACED BY routes/*.js

// REPLACED BY routes/*.js — kept for reference {{{
// // POST /api/proposals/generate — run proposal engine on-demand
// app.post('/api/proposals/generate', async (req, res, next) => {
//   try {
//     const { execSync } = await import('child_process');
//     const output = execSync(`${process.env.HOME}/bin/proposal-engine-v2.sh 2>&1`, { timeout: 30000, encoding: 'utf8' });
//     // Count created proposals
//     const created = (output.match(/CREATED:/g) || []).length;
//     // Also count total pending
//     const totalMatch = output.match(/total pending:\s*(\d+)/);
//     const totalPending = totalMatch ? parseInt(totalMatch[1]) : created;
//     broadcast({ type: 'proposal', action: 'generated', data: { count: created, total: totalPending } });
//     res.json({ ok: true, created, totalPending, output: output.trim() });
//   } catch (err) {
//     res.status(500).json({ error: err.message, output: err.stdout || '' });
//   }
// });
// }}} END REPLACED BY routes/*.js

// REPLACED BY routes/*.js — kept for reference {{{
// // GET /api/proposals — list proposals (default: pending)
// app.get('/api/proposals', async (req, res, next) => {
//   try {
//     const status = req.query.status || 'pending';
//     const files = await readdir(PROPOSALS_DIR);
//     const items = [];
//     for (const f of files) {
//       if (!f.endsWith('.json')) continue;
//       try {
//         const raw = await readFile(join(PROPOSALS_DIR, f), 'utf8');
//         const item = JSON.parse(raw);
//         if (status === 'all' || item.status === status) {
//           items.push(item);
//         }
//       } catch { /* skip corrupt */ }
//     }
//     // Sort: P0 first, then by created_at desc
//     items.sort((a, b) => {
//       const pa = parseInt((a.priority || 'P9').replace('P', ''));
//       const pb = parseInt((b.priority || 'P9').replace('P', ''));
//       if (pa !== pb) return pa - pb;
//       return (b.created_at || '').localeCompare(a.created_at || '');
//     });
//     res.json(items);
//   } catch (err) {
//     next(err);
//   }
// });
// }}} END REPLACED BY routes/*.js

// REPLACED BY routes/*.js — kept for reference {{{
// // POST /api/proposals/:id/resolve — approve or dismiss (calls proposal.sh for dispatch integration)
// app.post('/api/proposals/:id/resolve', async (req, res, next) => {
//   try {
//     const { action, option } = req.body; // action: 'approve' | 'dismiss'
//     if (!['approve', 'dismiss'].includes(action)) {
//       return res.status(400).json({ error: 'action must be approve or dismiss' });
//     }
    
//     const { execSync } = await import('child_process');
//     const proposalSh = join(process.env.HOME, 'bin', 'proposal.sh');
    
//     try {
//       if (action === 'approve') {
//         execSync(`${proposalSh} approve "${req.params.id}" "${option || 'approve'}"`, { timeout: 10000 });
//       } else {
//         execSync(`${proposalSh} dismiss "${req.params.id}"`, { timeout: 10000 });
//       }
//     } catch (err) {
//       return res.status(500).json({ error: `proposal.sh failed: ${err.message}` });
//     }
    
//     // Read the updated proposal
//     const filePath = join(PROPOSALS_DIR, `${req.params.id}.json`);
//     const raw = await readFile(filePath, 'utf8');
//     const item = JSON.parse(raw);
    
//     broadcast({ type: 'proposal', action: item.status, data: item });
//     res.json(item);
//   } catch (err) {
//     next(err);
//   }
// });
// }}} END REPLACED BY routes/*.js

// ---------------------------------------------------------------------------
// Feed API
// ---------------------------------------------------------------------------

async function readFeedLines() {
  try {
    const raw = await readFile(FEED_PATH, 'utf8');
    return raw.trim().split('\n').filter(Boolean).map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function appendJsonl(filePath, entry) {
  await appendFile(filePath, JSON.stringify(entry) + '\n');
}

// REPLACED BY routes/*.js — kept for reference {{{
// // GET /api/feed
// app.get('/api/feed', async (req, res, next) => {
//   try {
//     const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
//     const afterId = req.query.after || null;
//     const typeFilter = req.query.type || null;

//     let entries = await readFeedLines();

//     // newest first
//     entries.reverse();

//     if (typeFilter) {
//       entries = entries.filter(e => e.type === typeFilter);
//     }

//     if (afterId) {
//       const idx = entries.findIndex(e => e.id === afterId);
//       if (idx >= 0) {
//         entries = entries.slice(idx + 1);
//       }
//     }

//     res.json(entries.slice(0, limit));
//   } catch (err) {
//     next(err);
//   }
// });
// }}} END REPLACED BY routes/*.js

// REPLACED BY routes/*.js — kept for reference {{{
// // POST /api/feed
// app.post('/api/feed', async (req, res, next) => {
//   try {
//     const entry = {
//       id: req.body.id || `f-${Date.now()}`,
//       agent: req.body.agent || 'unknown',
//       type: req.body.type || 'info',
//       content: req.body.content || '',
//       timestamp: req.body.timestamp || new Date().toISOString(),
//       pinned: req.body.pinned || false,
//       urgent: req.body.urgent || false,
//     };

//     await appendJsonl(FEED_PATH, entry);
//     broadcast({ type: 'feed', data: entry });
//     res.status(201).json(entry);
//   } catch (err) {
//     next(err);
//   }
// });
// }}} END REPLACED BY routes/*.js

// ---------------------------------------------------------------------------
// Plans API (Kanban boards)
// ---------------------------------------------------------------------------
const PLANS_DIR = join(process.env.HOME, 'dispatch', 'plans');
if (!existsSync(PLANS_DIR)) mkdirSync(PLANS_DIR, { recursive: true });

// Seed plans if directory is empty
(async () => {
  try {
    const files = (await readdir(PLANS_DIR)).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
      const now = new Date().toISOString();
      const seedPlans = [
        {
          id: 'plan-agent-os-frontend',
          name: 'Agent OS Frontend',
          description: 'Native frontend to replace Discord as the primary interface. Interactive demo at trajanwj.github.io/agent-os-demo/',
          status: 'active',
          created_at: now, updated_at: now,
          columns: [
            { id: 'backlog', name: 'Backlog', color: '#6c7086' },
            { id: 'active', name: 'In Progress', color: '#f9e2af' },
            { id: 'review', name: 'Review', color: '#89b4fa' },
            { id: 'done', name: 'Done', color: '#a6e3a1' }
          ],
          relatedPlans: ['plan-system-improvements'],
          tasks: [
            { id: 'task-dashboard', title: 'Dashboard home page redesign', description: 'Replace flat feed with mission control layout.', column: 'done', agent: 'coder', priority: 'P2', labels: ['frontend','ux'], comments: [], created_at: now, updated_at: now },
            { id: 'task-bidi-sync', title: 'Bidirectional Discord sync', description: 'Messages flow both ways: WebUI→Discord via bot POST, Discord→WebUI via polling + WS broadcast.', column: 'done', agent: 'righthand', priority: 'P2', labels: ['bridge','sync'], comments: [], created_at: now, updated_at: now },
            { id: 'task-plans-page', title: 'Plans page — Kanban board', description: 'Agent-managed Kanban with multiple plans, cross-refs, live updates.', column: 'active', agent: 'coder', priority: 'P1', labels: ['frontend','new-page'], comments: [], created_at: now, updated_at: now },
            { id: 'task-mobile', title: 'Mobile optimization pass', description: 'Columns stack vertically on mobile, touch-friendly cards, responsive nav.', column: 'backlog', agent: null, priority: 'P3', labels: ['frontend','mobile'], comments: [], created_at: now, updated_at: now },
            { id: 'task-notifications', title: 'Notification system', description: 'Browser notifications for new proposals, task completions, agent errors.', column: 'backlog', agent: null, priority: 'P3', labels: ['frontend','ux'], comments: [], created_at: now, updated_at: now },
            { id: 'task-graph-viz', title: 'Knowledge graph visualization', description: 'Interactive force-directed graph from Neo4j data.', column: 'backlog', agent: null, priority: 'P4', labels: ['frontend','graph'], comments: [], created_at: now, updated_at: now }
          ]
        },
        {
          id: 'plan-system-improvements',
          name: 'System Improvements',
          description: 'Infrastructure, performance, and reliability improvements for the agent VM and bridge.',
          status: 'active',
          created_at: now, updated_at: now,
          columns: [
            { id: 'ideas', name: 'Ideas', color: '#cba6f7' },
            { id: 'planned', name: 'Planned', color: '#89b4fa' },
            { id: 'active', name: 'Active', color: '#f9e2af' },
            { id: 'shipped', name: 'Shipped', color: '#a6e3a1' }
          ],
          relatedPlans: ['plan-agent-os-frontend'],
          tasks: [
            { id: 'task-ws-gateway', title: 'Discord Gateway WebSocket', description: 'Replace REST polling with real-time Discord Gateway events for instant message delivery.', column: 'planned', agent: null, priority: 'P3', labels: ['bridge','performance'], blockedBy: [{ planId: 'plan-agent-os-frontend', taskId: 'task-bidi-sync', taskTitle: 'Bidirectional Discord sync' }], comments: [], created_at: now, updated_at: now },
            { id: 'task-bridge-health', title: 'Bridge health dashboard', description: 'Expose /api/health with uptime, memory, WS client count, request rates.', column: 'active', agent: 'ops', priority: 'P2', labels: ['bridge','monitoring'], comments: [], created_at: now, updated_at: now },
            { id: 'task-vault-perf', title: 'Vault search performance', description: 'Index vault notes for sub-100ms search via QMD cache layer.', column: 'ideas', agent: null, priority: 'P3', labels: ['vault','performance'], comments: [], created_at: now, updated_at: now },
            { id: 'task-agent-metrics', title: 'Agent performance metrics', description: 'Track success rates, latency, token usage per agent per task type.', column: 'ideas', agent: null, priority: 'P3', labels: ['agents','analytics'], comments: [], created_at: now, updated_at: now }
          ]
        }
      ];
      for (const plan of seedPlans) {
        await writeFile(join(PLANS_DIR, `${plan.id}.json`), JSON.stringify(plan, null, 2));
      }
      console.log('[Plans] Seeded 2 default plans');
    }
  } catch (e) { console.error('[Plans] Seed error:', e.message); }
})();

// GET /api/plans
app.get('/api/plans', async (_req, res, next) => {
  try {
    const files = await readdir(PLANS_DIR);
    const plans = [];
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      try {
        const raw = await readFile(join(PLANS_DIR, f), 'utf8');
        const plan = JSON.parse(raw);
        plans.push({ id: plan.id, name: plan.name, description: plan.description, status: plan.status, task_count: (plan.tasks || []).length, updated_at: plan.updated_at });
      } catch { /* skip */ }
    }
    plans.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
    res.json(plans);
  } catch (err) { next(err); }
});

// POST /api/plans
app.post('/api/plans', async (req, res, next) => {
  try {
    const { name, description, columns } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const id = `plan-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    const now = new Date().toISOString();
    const plan = {
      id, name, description: description || '',
      status: 'active', created_at: now, updated_at: now,
      columns: columns || [
        { id: 'backlog', name: 'Backlog', color: '#6c7086' },
        { id: 'active', name: 'In Progress', color: '#f9e2af' },
        { id: 'review', name: 'Review', color: '#89b4fa' },
        { id: 'done', name: 'Done', color: '#a6e3a1' },
      ],
      tasks: [],
    };
    await writeFile(join(PLANS_DIR, `${id}.json`), JSON.stringify(plan, null, 2));
    broadcast({ type: 'plan', action: 'created', data: plan });
    res.status(201).json(plan);
  } catch (err) { next(err); }
});

// GET /api/plans/:id
app.get('/api/plans/:id', async (req, res, next) => {
  try {
    const filePath = join(PLANS_DIR, `${req.params.id}.json`);
    const raw = await readFile(filePath, 'utf8');
    res.json(JSON.parse(raw));
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(404).json({ error: 'Plan not found' });
    next(err);
  }
});

// PUT /api/plans/:id
app.put('/api/plans/:id', async (req, res, next) => {
  try {
    const filePath = join(PLANS_DIR, `${req.params.id}.json`);
    const raw = await readFile(filePath, 'utf8');
    const plan = JSON.parse(raw);
    const { name, description, status, columns } = req.body;
    if (name !== undefined) plan.name = name;
    if (description !== undefined) plan.description = description;
    if (status !== undefined) plan.status = status;
    if (columns !== undefined) plan.columns = columns;
    plan.updated_at = new Date().toISOString();
    await writeFile(filePath, JSON.stringify(plan, null, 2));
    broadcast({ type: 'plan', action: 'updated', data: plan });
    res.json(plan);
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(404).json({ error: 'Plan not found' });
    next(err);
  }
});

// DELETE /api/plans/:id
app.delete('/api/plans/:id', async (req, res, next) => {
  try {
    await unlink(join(PLANS_DIR, `${req.params.id}.json`));
    broadcast({ type: 'plan', action: 'deleted', data: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(404).json({ error: 'Plan not found' });
    next(err);
  }
});

// POST /api/plans/:id/tasks
app.post('/api/plans/:id/tasks', async (req, res, next) => {
  try {
    const filePath = join(PLANS_DIR, `${req.params.id}.json`);
    const raw = await readFile(filePath, 'utf8');
    const plan = JSON.parse(raw);
    const { title, description, column, agent, priority, labels } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      title, description: description || '', column: column || 'backlog',
      agent: agent || null, priority: priority || 'P3',
      labels: labels || [], comments: [],
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    plan.tasks.push(task);
    plan.updated_at = new Date().toISOString();
    await writeFile(filePath, JSON.stringify(plan, null, 2));
    broadcast({ type: 'plan', action: 'task_created', data: { plan_id: plan.id, task } });
    res.status(201).json(task);
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(404).json({ error: 'Plan not found' });
    next(err);
  }
});

// PUT /api/plans/:id/tasks/:taskId
app.put('/api/plans/:id/tasks/:taskId', async (req, res, next) => {
  try {
    const filePath = join(PLANS_DIR, `${req.params.id}.json`);
    const raw = await readFile(filePath, 'utf8');
    const plan = JSON.parse(raw);
    const task = plan.tasks.find(t => t.id === req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const { title, description, column, agent, priority, labels, comment } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (column !== undefined) task.column = column;
    if (agent !== undefined) task.agent = agent;
    if (priority !== undefined) task.priority = priority;
    if (labels !== undefined) task.labels = labels;
    if (comment) {
      task.comments = task.comments || [];
      task.comments.push({ agent: comment.agent || 'user', text: comment.text, at: new Date().toISOString() });
    }
    task.updated_at = new Date().toISOString();
    plan.updated_at = new Date().toISOString();
    await writeFile(filePath, JSON.stringify(plan, null, 2));
    broadcast({ type: 'plan', action: 'task_updated', data: { plan_id: plan.id, task } });
    res.json(task);
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(404).json({ error: 'Plan not found' });
    next(err);
  }
});

// DELETE /api/plans/:id/tasks/:taskId
app.delete('/api/plans/:id/tasks/:taskId', async (req, res, next) => {
  try {
    const filePath = join(PLANS_DIR, `${req.params.id}.json`);
    const raw = await readFile(filePath, 'utf8');
    const plan = JSON.parse(raw);
    plan.tasks = plan.tasks.filter(t => t.id !== req.params.taskId);
    plan.updated_at = new Date().toISOString();
    await writeFile(filePath, JSON.stringify(plan, null, 2));
    broadcast({ type: 'plan', action: 'task_deleted', data: { plan_id: plan.id, task_id: req.params.taskId } });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(404).json({ error: 'Plan not found' });
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Vault API
// ---------------------------------------------------------------------------
const VAULT_DIR = join(process.env.HOME, 'vault');

function execPromise(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: 15000, maxBuffer: 5 * 1024 * 1024, ...opts }, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(stdout);
    });
  });
}

// GET /api/vault/search?q=TERM
app.get('/api/vault/search', async (req, res, next) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) return res.json([]);
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
    const stdout = await execPromise('/usr/bin/qmd', ['search', q, '--limit', String(limit), '--json']);
    let results = [];
    try { results = JSON.parse(stdout); } catch { results = []; }
    // Normalize qmd results: strip qmd:// prefix from file paths
    results = results.map(r => ({
      docid: r.docid,
      score: r.score,
      path: (r.file || '').replace(/^qmd:\/\/vault\//, ''),
      title: r.title || '',
      snippet: r.snippet || '',
      context: r.context || '',
    }));
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// GET /api/vault/note?path=PATH
app.get('/api/vault/note', async (req, res, next) => {
  try {
    const notePath = req.query.path;
    if (!notePath) return res.status(400).json({ error: 'path required' });
    // Security: prevent directory traversal
    let resolved = join(VAULT_DIR, notePath);
    if (!resolved.startsWith(VAULT_DIR)) return res.status(403).json({ error: 'forbidden' });
    // Fuzzy path fallback: qmd lowercases and uses hyphens for spaces
    if (!existsSync(resolved)) {
      const parts = notePath.split('/');
      let current = VAULT_DIR;
      let found = true;
      for (const part of parts) {
        try {
          const entries = await readdir(current);
          // Try exact, case-insensitive, then normalized (hyphens→spaces)
          const norm = p => p.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ');
          const match = entries.find(e => e === part) ||
                        entries.find(e => e.toLowerCase() === part.toLowerCase()) ||
                        entries.find(e => norm(e) === norm(part));
          if (match) {
            current = join(current, match);
          } else {
            found = false; break;
          }
        } catch { found = false; break; }
      }
      if (found && existsSync(current)) {
        resolved = current;
      } else {
        return res.status(404).json({ error: 'not found' });
      }
    }

    const content = await readFile(resolved, 'utf8');
    const fileStat = await stat(resolved);
    // Parse frontmatter
    let frontmatter = {};
    let body = content;
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (fmMatch) {
      body = fmMatch[2];
      // Simple YAML-like parsing
      fmMatch[1].split('\n').forEach(line => {
        const m = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
        if (m) frontmatter[m[1]] = m[2].replace(/^["']|["']$/g, '');
      });
    }
    // Extract wikilinks
    const wikilinks = [];
    const linkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
    let lm;
    while ((lm = linkRegex.exec(content)) !== null) {
      wikilinks.push({ target: lm[1].trim(), alias: lm[2] ? lm[2].trim() : null });
    }
    // Word count
    const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
    // Modified date
    const modified = fileStat.mtime.toISOString();
    // Backlinks — find other notes that link to this one
    const noteBasename = basename(resolved, '.md').toLowerCase();
    let backlinks = [];
    try {
      const grepOut = await new Promise((resolve, reject) => {
        execCb(`grep -rl '\\[\\[${noteBasename}' "${VAULT_DIR}" --include='*.md' 2>/dev/null || true`,
          { timeout: 10000, maxBuffer: 2 * 1024 * 1024 }, (err, stdout) => {
            if (err) return resolve('');
            resolve(stdout);
          });
      });
      backlinks = grepOut.trim().split('\n').filter(Boolean)
        .map(p => p.replace(VAULT_DIR + '/', ''))
        .filter(p => p !== notePath && !p.includes(notePath));
    } catch { /* ignore */ }
    res.json({ path: notePath, content: body, frontmatter, wikilinks, backlinks, wordCount, modified });
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(404).json({ error: 'not found' });
    next(err);
  }
});

// GET /api/vault/recent?limit=20
app.get('/api/vault/recent', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const stdout = await execPromise('/usr/bin/find', [
      VAULT_DIR, '-name', '*.md', '-mmin', '-1440',
      '-printf', '%T@ %P\n'
    ]);
    const lines = stdout.trim().split('\n').filter(Boolean);
    lines.sort((a, b) => parseFloat(b) - parseFloat(a));
    const results = lines.slice(0, limit).map(line => {
      const spaceIdx = line.indexOf(' ');
      const ts = parseFloat(line.substring(0, spaceIdx));
      const path = line.substring(spaceIdx + 1);
      return { path, modified: new Date(ts * 1000).toISOString() };
    });
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// GET /api/vault/stats
app.get('/api/vault/stats', async (req, res, next) => {
  try {
    // Count notes and size per top-level directory
    const entries = await readdir(VAULT_DIR, { withFileTypes: true });
    const categories = {};
    let totalNotes = 0;
    let totalSize = 0;

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        if (entry.name.endsWith('.md')) {
          totalNotes++;
          const s = await stat(join(VAULT_DIR, entry.name));
          totalSize += s.size;
          categories['root'] = (categories['root'] || 0) + 1;
        }
        continue;
      }
      // Count .md files recursively using find
      try {
        const stdout = await execPromise('/usr/bin/find', [
          join(VAULT_DIR, entry.name), '-name', '*.md', '-type', 'f'
        ]);
        const files = stdout.trim().split('\n').filter(Boolean);
        const count = files.length;
        if (count > 0) {
          categories[entry.name] = count;
          totalNotes += count;
        }
        // Get size
        const sizeOut = await execPromise('/usr/bin/du', ['-sb', join(VAULT_DIR, entry.name)]);
        const dirSize = parseInt(sizeOut.split('\t')[0]) || 0;
        totalSize += dirSize;
      } catch { /* skip */ }
    }
    // Folders array sorted by count desc
    const folders = Object.entries(categories)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    // Total wikilinks
    let totalLinks = 0;
    try {
      const linksOut = await new Promise((resolve, reject) => {
        execCb(`grep -r '\\[\\[' "${VAULT_DIR}" --include='*.md' 2>/dev/null | wc -l`,
          { timeout: 15000 }, (err, stdout) => {
            if (err) return resolve('0');
            resolve(stdout.trim());
          });
      });
      totalLinks = parseInt(linksOut) || 0;
    } catch { /* ignore */ }
    // Last updated note
    let lastUpdated = null;
    try {
      const recentOut = await execPromise('/usr/bin/find', [
        VAULT_DIR, '-name', '*.md', '-type', 'f', '-printf', '%T@ %P\n'
      ]);
      const recentLines = recentOut.trim().split('\n').filter(Boolean);
      if (recentLines.length > 0) {
        recentLines.sort((a, b) => parseFloat(b) - parseFloat(a));
        const ts = parseFloat(recentLines[0].split(' ')[0]);
        lastUpdated = new Date(ts * 1000).toISOString();
      }
    } catch { /* ignore */ }
    res.json({ total_notes: totalNotes, totalNotes, totalSize, categories, folders, total_links: totalLinks, last_updated: lastUpdated });
  } catch (err) {
    next(err);
  }
});

// GET /api/vault/folders
app.get('/api/vault/folders', async (req, res, next) => {
  try {
    const entries = await readdir(VAULT_DIR, { withFileTypes: true });
    const folders = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      try {
        const stdout = await execPromise('/usr/bin/find', [
          join(VAULT_DIR, entry.name), '-name', '*.md', '-type', 'f'
        ]);
        const files = stdout.trim().split('\n').filter(Boolean);
        if (files.length > 0) {
          folders.push({ name: entry.name, count: files.length });
        }
      } catch { /* skip */ }
    }
    // Root-level .md files
    const rootFiles = entries.filter(e => !e.isDirectory() && e.name.endsWith('.md'));
    if (rootFiles.length > 0) {
      folders.push({ name: 'root', count: rootFiles.length });
    }
    folders.sort((a, b) => b.count - a.count);
    res.json(folders);
  } catch (err) {
    next(err);
  }
});

// GET /api/vault/tags — all tags used in vault notes with counts
app.get('/api/vault/tags', async (req, res, next) => {
  try {
    // Find all tags in frontmatter and inline #tags
    const stdout = await execPromise('/usr/bin/find', [
      VAULT_DIR, '-name', '*.md', '-type', 'f', '-not', '-path', '*/.archive/*'
    ]);
    const allFiles = stdout.trim().split('\n').filter(Boolean);
    const tagCounts = {};
    for (const filePath of allFiles) {
      try {
        const content = await readFile(filePath, 'utf8');
        // Frontmatter tags (tags: [a, b] or tags: a, b)
        const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (fmMatch) {
          const tagsLine = fmMatch[1].split('\n').find(l => l.match(/^tags\s*:/));
          if (tagsLine) {
            const tagsPart = tagsLine.replace(/^tags\s*:\s*/, '').replace(/[\[\]"']/g, '');
            tagsPart.split(/[,\s]+/).filter(Boolean).forEach(t => {
              const tag = t.trim().replace(/^#/, '');
              if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
          }
        }
        // Inline #tags (not inside code blocks or links)
        const inlineTags = content.match(/(?:^|\s)#([a-zA-Z][\w-/]*)/g);
        if (inlineTags) {
          inlineTags.forEach(m => {
            const tag = m.trim().replace(/^#/, '');
            if (tag && !['region', 'endif', 'ifdef', 'ifndef', 'define', 'include', 'pragma'].includes(tag)) {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
          });
        }
      } catch { /* skip unreadable */ }
    }
    const tags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
    res.json(tags);
  } catch (err) {
    next(err);
  }
});

// GET /api/vault/backlinks/:path — all notes that link to the given path
app.get('/api/vault/backlinks/:path(*)', async (req, res, next) => {
  try {
    const notePath = req.params.path;
    if (!notePath) return res.status(400).json({ error: 'path required' });
    const noteBasename = basename(notePath, '.md').toLowerCase();
    const grepOut = await new Promise((resolve) => {
      execCb(`grep -rl '\\[\\[${noteBasename}' "${VAULT_DIR}" --include='*.md' 2>/dev/null || true`,
        { timeout: 10000, maxBuffer: 2 * 1024 * 1024 }, (err, stdout) => {
          resolve(stdout || '');
        });
    });
    const backlinks = grepOut.trim().split('\n').filter(Boolean)
      .map(p => p.replace(VAULT_DIR + '/', ''))
      .filter(p => p !== notePath);
    res.json(backlinks.map(p => ({ path: p, title: basename(p, '.md') })));
  } catch (err) {
    next(err);
  }
});

// POST /api/vault/note — create a new vault note
app.post('/api/vault/note', async (req, res, next) => {
  try {
    const { path: notePath, content, frontmatter } = req.body;
    if (!notePath) return res.status(400).json({ error: 'path required' });
    if (content == null) return res.status(400).json({ error: 'content required' });
    // Security: prevent directory traversal
    const resolved = join(VAULT_DIR, notePath);
    if (!resolved.startsWith(VAULT_DIR)) return res.status(403).json({ error: 'forbidden' });
    if (existsSync(resolved)) return res.status(409).json({ error: 'note already exists, use PUT to update' });
    // Build content with optional frontmatter
    let fullContent = '';
    if (frontmatter && Object.keys(frontmatter).length > 0) {
      fullContent += '---\n';
      for (const [k, v] of Object.entries(frontmatter)) {
        if (Array.isArray(v)) {
          fullContent += `${k}: [${v.join(', ')}]\n`;
        } else {
          fullContent += `${k}: ${v}\n`;
        }
      }
      fullContent += '---\n';
    }
    fullContent += content;
    // Ensure parent directory exists
    const dir = dirname(resolved);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    await writeFile(resolved, fullContent);
    // Run qmd update in background
    execCb('qmd update 2>/dev/null', { timeout: 30000 }, () => {});
    res.status(201).json({ path: notePath, created: true });
  } catch (err) {
    next(err);
  }
});

// PUT /api/vault/note/:path — update an existing vault note
app.put('/api/vault/note/:path(*)', async (req, res, next) => {
  try {
    const notePath = req.params.path;
    if (!notePath) return res.status(400).json({ error: 'path required' });
    const { content, frontmatter } = req.body;
    if (content == null) return res.status(400).json({ error: 'content required' });
    // Security: prevent directory traversal
    const resolved = join(VAULT_DIR, notePath);
    if (!resolved.startsWith(VAULT_DIR)) return res.status(403).json({ error: 'forbidden' });
    if (!existsSync(resolved)) return res.status(404).json({ error: 'note not found' });
    // Build content with optional frontmatter
    let fullContent = '';
    if (frontmatter && Object.keys(frontmatter).length > 0) {
      fullContent += '---\n';
      for (const [k, v] of Object.entries(frontmatter)) {
        if (Array.isArray(v)) {
          fullContent += `${k}: [${v.join(', ')}]\n`;
        } else {
          fullContent += `${k}: ${v}\n`;
        }
      }
      fullContent += '---\n';
    }
    fullContent += content;
    await writeFile(resolved, fullContent);
    // Run qmd update in background
    execCb('qmd update 2>/dev/null', { timeout: 30000 }, () => {});
    res.json({ path: notePath, updated: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/vault/graph
app.get('/api/vault/graph', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 300);
    const nodeMap = new Map(); // path -> node
    const edges = [];

    // Use find to get recent .md files for graph nodes (broader than qmd empty search)
    const stdout = await execPromise('/usr/bin/find', [
      VAULT_DIR, '-name', '*.md', '-type', 'f', '-not', '-path', '*/.archive/*',
      '-not', '-path', '*/sessions/*', '-not', '-path', '*/Templates/*',
      '-printf', '%P\n'
    ]);
    const allPaths = stdout.trim().split('\n').filter(Boolean).slice(0, limit);

    for (const relPath of allPaths) {
      const parts = relPath.split('/');
      const category = parts.length > 1 ? parts[0] : 'root';
      const title = basename(relPath, '.md');
      // Use lowercase path as ID for consistency
      nodeMap.set(relPath.toLowerCase(), { id: relPath.toLowerCase(), title, category });
    }

    // Build lookup indices for wikilink matching
    const titleIndex = new Map(); // lowercase title -> path
    const nameIndex = new Map();  // lowercase basename (no ext) -> path
    const normIndex = new Map();  // normalized path (lower, hyphens→spaces) -> path
    for (const [path, node] of nodeMap) {
      const t = node.title.toLowerCase();
      if (!titleIndex.has(t)) titleIndex.set(t, path);
      const b = basename(path, '.md').toLowerCase().replace(/[-_]/g, ' ');
      if (!nameIndex.has(b)) nameIndex.set(b, path);
      const n = path.toLowerCase().replace(/[-_]/g, ' ').replace(/\.md$/, '');
      if (!normIndex.has(n)) normIndex.set(n, path);
    }

    // Parse wikilinks from notes to build edges and count links per node
    const edgeSet = new Set();
    const linkCounts = new Map(); // path -> outgoing link count
    for (const relPath of allPaths) {
      const path = relPath.toLowerCase();
      try {
        const content = await readFile(join(VAULT_DIR, relPath), 'utf8');
        const linkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
        let match;
        let count = 0;
        while ((match = linkRegex.exec(content)) !== null) {
          count++;
          const target = match[1].trim().toLowerCase().replace(/[-_]/g, ' ');
          // Try to find matching node
          const targetPath = titleIndex.get(target) ||
                             nameIndex.get(target) ||
                             normIndex.get(target) ||
                             normIndex.get(target.replace(/\.md$/, ''));
          if (targetPath && targetPath !== path) {
            const key = path < targetPath ? `${path}|${targetPath}` : `${targetPath}|${path}`;
            if (!edgeSet.has(key)) {
              edgeSet.add(key);
              edges.push({ source: path, target: targetPath, type: 'wikilink' });
            }
          }
        }
        linkCounts.set(path, count);
      } catch { /* skip unreadable files */ }
    }

    // Add link counts to nodes
    const nodes = Array.from(nodeMap.values()).map(n => ({
      ...n,
      links: linkCounts.get(n.id) || 0,
      folder: n.category,
    }));
    res.json({ nodes, edges });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Dispatch Task API — Create and approve tasks from WebUI
// ---------------------------------------------------------------------------

// POST /api/dispatch/task — create a new dispatch task
app.post('/api/dispatch/task', async (req, res, next) => {
  try {
    const { title, agent, priority, description } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const task = {
      id,
      title,
      agent: agent || 'righthand',
      priority: priority || 'P2',
      description: description || '',
      status: 'queued',
      source: 'webui',
      created_at: now,
    };
    await writeFile(join(QUEUE_DIR, `${id}.json`), JSON.stringify(task, null, 2));
    await rebuildQueueIndex();
    broadcast({ type: 'queue', action: 'new', data: task });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// POST /api/dispatch/task/:id/approve — move task from queue to active
app.post('/api/dispatch/task/:id/approve', async (req, res, next) => {
  try {
    const taskId = req.params.id;
    // Find the task in queue
    const srcPath = join(QUEUE_DIR, `${taskId}.json`);
    let task;
    try {
      const raw = await readFile(srcPath, 'utf8');
      task = JSON.parse(raw);
    } catch (err) {
      if (err.code === 'ENOENT') return res.status(404).json({ error: 'Task not found in queue' });
      throw err;
    }
    task.status = 'active';
    task.approved_at = new Date().toISOString();
    // Move to active dir
    const dstPath = join(ACTIVE_DIR, `${taskId}.json`);
    await writeFile(dstPath, JSON.stringify(task, null, 2));
    await unlink(srcPath).catch(() => {});
    await rebuildQueueIndex();
    broadcast({ type: 'task', action: 'approved', data: task });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// System API — Operations Dashboard
// ---------------------------------------------------------------------------

function shellExec(cmd, opts = {}) {
  return new Promise((resolve, reject) => {
    execCb(cmd, { timeout: 10000, maxBuffer: 2 * 1024 * 1024, ...opts }, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(stdout.trim());
    });
  });
}

// REPLACED BY routes/*.js — kept for reference {{{
// // GET /api/system/overview — uptime, load, memory, disk, key service statuses
// app.get('/api/system/overview', async (_req, res, next) => {
//   try {
//     const [uptimeRaw, loadRaw, memRaw, diskRaw] = await Promise.all([
//       shellExec('uptime -p').catch(() => 'unknown'),
//       shellExec('cat /proc/loadavg').catch(() => '0 0 0 0 0'),
//       shellExec('free -m').catch(() => ''),
//       shellExec("df -h / | tail -1").catch(() => ''),
//     ]);

//     // Parse load
//     const loadParts = loadRaw.split(/\s+/);
//     const load = { avg1: parseFloat(loadParts[0]) || 0, avg5: parseFloat(loadParts[1]) || 0, avg15: parseFloat(loadParts[2]) || 0 };

//     // Parse memory
//     let memory = { total: 0, used: 0, available: 0 };
//     const memLines = memRaw.split('\n');
//     const memData = memLines.find(l => l.startsWith('Mem:'));
//     if (memData) {
//       const mp = memData.split(/\s+/);
//       memory = { total: parseInt(mp[1]) || 0, used: parseInt(mp[2]) || 0, available: parseInt(mp[6]) || 0 };
//     }

//     // Parse disk
//     let disk = { total: '0', used: '0', available: '0', percent: '0%' };
//     if (diskRaw) {
//       const dp = diskRaw.split(/\s+/);
//       disk = { total: dp[1] || '0', used: dp[2] || '0', available: dp[3] || '0', percent: dp[4] || '0%' };
//     }

//     // Service statuses
//     const services = ['openclaw-gateway', 'oauth-guardian', 'agent-os-bridge', 'bridge-sync'];
//     const serviceStatuses = {};
//     await Promise.all(services.map(async (svc) => {
//       try {
//         const status = await shellExec(`systemctl is-active ${svc}`);
//         serviceStatuses[svc] = status;
//       } catch { serviceStatuses[svc] = 'inactive'; }
//     }));

//     res.json({
//       uptime: uptimeRaw.replace('up ', ''),
//       load,
//       memory,
//       disk,
//       services: serviceStatuses,
//       timestamp: new Date().toISOString(),
//     });
//   } catch (err) { next(err); }
// });
// }}} END REPLACED BY routes/*.js

// REPLACED BY routes/*.js — kept for reference {{{
// // GET /api/system/agents — dispatch queue + done counts per agent
// app.get('/api/system/agents', async (_req, res, next) => {
//   try {
//     const agents = {};
//     // Active/queued tasks
//     try {
//       const queueFiles = await readdir(QUEUE_DIR);
//       for (const f of queueFiles) {
//         if (!f.endsWith('.json') || f === 'index.json') continue;
//         try {
//           const raw = await readFile(join(QUEUE_DIR, f), 'utf8');
//           const task = JSON.parse(raw);
//           const agent = task.agent || task.source || 'unknown';
//           if (!agents[agent]) agents[agent] = { queued: [], doneCount: 0 };
//           agents[agent].queued.push({ id: task.id, title: task.title || task.question || f, priority: task.priority, created: task.created_at });
//         } catch { /* skip malformed */ }
//       }
//     } catch { /* queue dir might not exist */ }

//     // Done counts
//     try {
//       const doneFiles = await readdir(DONE_DIR);
//       for (const f of doneFiles) {
//         if (!f.endsWith('.json')) continue;
//         try {
//           const raw = await readFile(join(DONE_DIR, f), 'utf8');
//           const task = JSON.parse(raw);
//           const agent = task.agent || task.source || 'unknown';
//           if (!agents[agent]) agents[agent] = { queued: [], doneCount: 0 };
//           agents[agent].doneCount++;
//         } catch { /* skip */ }
//       }
//     } catch { /* done dir might not exist */ }

//     res.json(agents);
//   } catch (err) { next(err); }
// });
// }}} END REPLACED BY routes/*.js

// REPLACED BY routes/*.js — kept for reference {{{
// // GET /api/system/crons — crontab entries + systemd timers
// app.get('/api/system/crons', async (_req, res, next) => {
//   try {
//     const crons = [];

//     // Crontab
//     try {
//       const crontab = await shellExec('crontab -l 2>/dev/null');
//       crontab.split('\n').forEach(line => {
//         line = line.trim();
//         if (!line || line.startsWith('#')) return;
//         const parts = line.split(/\s+/);
//         if (parts.length >= 6) {
//           const schedule = parts.slice(0, 5).join(' ');
//           const command = parts.slice(5).join(' ');
//           crons.push({ type: 'crontab', schedule, command: command.substring(0, 120), status: 'scheduled' });
//         }
//       });
//     } catch { /* no crontab */ }

//     // Systemd timers
//     const timers = [];
//     try {
//       const timerRaw = await shellExec('systemctl list-timers --no-pager --plain 2>/dev/null');
//       timerRaw.split('\n').forEach((line, i) => {
//         if (i === 0 || !line.trim()) return; // skip header
//         const parts = line.trim().split(/\s{2,}/);
//         if (parts.length >= 4) {
//           timers.push({
//             type: 'systemd',
//             next: parts[0] || '',
//             left: parts[1] || '',
//             last: parts[2] || '',
//             passed: parts[3] || '',
//             unit: parts[4] || '',
//             activates: parts[5] || '',
//           });
//         }
//       });
//     } catch { /* no systemd timers */ }

//     res.json({ crons, timers });
//   } catch (err) { next(err); }
// });
// }}} END REPLACED BY routes/*.js

// GET /api/system/services — relevant running services
app.get('/api/system/services', async (_req, res, next) => {
  try {
    const relevant = ['openclaw-gateway', 'oauth-guardian', 'agent-os-bridge', 'bridge-sync'];
    const services = [];

    await Promise.all(relevant.map(async (svc) => {
      try {
        const raw = await shellExec(`systemctl show ${svc} --no-pager --property=ActiveState,SubState,MainPID,ActiveEnterTimestamp,Description 2>/dev/null`);
        const props = {};
        raw.split('\n').forEach(line => {
          const [k, ...v] = line.split('=');
          if (k) props[k.trim()] = v.join('=').trim();
        });
        services.push({
          name: svc,
          active: props.ActiveState || 'unknown',
          sub: props.SubState || 'unknown',
          pid: parseInt(props.MainPID) || 0,
          since: props.ActiveEnterTimestamp || '',
          description: props.Description || svc,
        });
      } catch {
        services.push({ name: svc, active: 'unknown', sub: 'unknown', pid: 0, since: '', description: svc });
      }
    }));

    res.json(services);
  } catch (err) { next(err); }
});

// GET /api/system/logs?service=NAME&lines=50
app.get('/api/system/logs', async (req, res, next) => {
  try {
    const service = (req.query.service || '').replace(/[^a-zA-Z0-9_.-]/g, '');
    const lines = Math.min(parseInt(req.query.lines || '50', 10), 200);
    if (!service) return res.status(400).json({ error: 'service parameter required' });

    // Allowlist
    const allowed = ['openclaw-gateway', 'oauth-guardian', 'agent-os-bridge', 'bridge-sync'];
    if (!allowed.includes(service)) return res.status(403).json({ error: 'service not allowed' });

    const raw = await shellExec(`journalctl -u ${service} --no-pager -n ${lines} --output=short-iso 2>/dev/null`);
    const logLines = raw.split('\n').map(line => {
      // Parse ISO timestamp + severity
      const match = line.match(/^(\S+)\s+\S+\s+\S+\[?\d*\]?:\s*(.*)/);
      if (match) return { ts: match[1], text: match[2] };
      return { ts: '', text: line };
    });

    res.json({ service, lines: logLines });
  } catch (err) { next(err); }
});

// GET /api/system/processes — top processes by memory
app.get('/api/system/processes', async (_req, res, next) => {
  try {
    const raw = await shellExec('ps aux --sort=-%mem | head -15');
    const lines = raw.split('\n');
    const header = lines[0];
    const processes = lines.slice(1).map(line => {
      const parts = line.split(/\s+/);
      if (parts.length < 11) return null;
      return {
        user: parts[0],
        pid: parseInt(parts[1]),
        cpu: parseFloat(parts[2]),
        mem: parseFloat(parts[3]),
        vsz: parseInt(parts[4]),
        rss: parseInt(parts[5]),
        command: parts.slice(10).join(' ').substring(0, 100),
      };
    }).filter(Boolean);

    res.json(processes);
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Agent Activity API (Workbench)
// ---------------------------------------------------------------------------

// REPLACED BY routes/*.js — kept for reference {{{
// // GET /api/agents/:id/activity — last 20 feed events + task info for an agent
// app.get('/api/agents/:id/activity', async (req, res, next) => {
//   try {
//     const agentId = req.params.id;
//     let entries = await readFeedLines();
//     entries.reverse();

//     // Filter to this agent
//     const agentEvents = entries
//       .filter(e => e.agent === agentId)
//       .slice(0, 20)
//       .map(e => ({
//         id: e.id,
//         type: e.type || 'info',
//         content: e.content || e.summary || e.detail || '',
//         time: e.timestamp ? new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
//         timestamp: e.timestamp || '',
//       }));

//     // Get current task from queue
//     let currentTask = null;
//     let tokens = 0;
//     let runtime = 0;
//     let startTime = null;
//     try {
//       const queueFiles = await readdir(QUEUE_DIR);
//       for (const f of queueFiles) {
//         if (!f.endsWith('.json') || f === 'index.json') continue;
//         try {
//           const raw = await readFile(join(QUEUE_DIR, f), 'utf8');
//           const task = JSON.parse(raw);
//           if ((task.agent || task.source) === agentId) {
//             currentTask = { id: task.id, title: task.title || task.question || f, priority: task.priority };
//             if (task.created_at) {
//               startTime = task.created_at;
//               runtime = Math.floor((Date.now() - new Date(task.created_at).getTime()) / 1000);
//             }
//             break;
//           }
//         } catch { /* skip malformed */ }
//       }
//     } catch { /* queue dir might not exist */ }

//     res.json({
//       agent: agentId,
//       events: agentEvents,
//       task: currentTask,
//       tokens,
//       runtime,
//       startTime,
//     });
//   } catch (err) { next(err); }
// });
// }}} END REPLACED BY routes/*.js

// POST /api/agents/:id/stop — send stop signal for an agent
app.post('/api/agents/:id/stop', async (req, res, next) => {
  try {
    const agentId = req.params.id;
    const entry = {
      id: `stop-${agentId}-${Date.now()}`,
      agent: agentId,
      type: 'system',
      content: `Stop signal sent to ${agentId}`,
      timestamp: new Date().toISOString(),
    };
    await appendJsonl(FEED_PATH, entry);
    broadcast({ type: 'feed', data: entry });
    broadcast({ type: 'agent_stop', data: { agent: agentId } });
    res.json({ ok: true, agent: agentId });
  } catch (err) { next(err); }
});

// Agent Message API (Plan actions + Chat router)
// ---------------------------------------------------------------------------
const INTER_AGENT_DIR = join(process.env.HOME, 'dispatch', 'inter-agent', 'inbox');
if (!existsSync(INTER_AGENT_DIR)) mkdirSync(INTER_AGENT_DIR, { recursive: true });

// POST /api/agent/message — accepts {message, context, plan, task}
app.post('/api/agent/message', async (req, res, next) => {
  try {
    const { message, context, plan, task } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    const entry = {
      id,
      message,
      context: context || '',
      plan: plan || null,
      task: task || null,
      timestamp: new Date().toISOString(),
      source: 'webui',
    };
    await writeFile(join(INTER_AGENT_DIR, `${id}.json`), JSON.stringify(entry, null, 2));
    broadcast({ type: 'agent_message', data: entry });
    res.json({ ok: true, id });
  } catch (err) { next(err); }
});

// POST /api/agent/chat — accepts {message, agent, context, page}
app.post('/api/agent/chat', async (req, res, next) => {
  try {
    const { message, agent, context, page } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });
    const id = `chat-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    const routed_to = agent || 'righthand';
    const entry = {
      id,
      message,
      agent: routed_to,
      routed_to,
      context: context || '',
      page: page || '',
      timestamp: new Date().toISOString(),
      source: 'webui-chat',
    };
    await writeFile(join(INTER_AGENT_DIR, `${id}.json`), JSON.stringify(entry, null, 2));
    broadcast({ type: 'agent_chat', data: entry });
    res.json({ ok: true, id, agent: routed_to, routed_to });
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// Route aliases — frontend compatibility
// ---------------------------------------------------------------------------
// /api/overview → redirect to /api/system/overview
app.get('/api/overview', (req, res) => res.redirect(307, '/api/system/overview'));

// /api/events → redirect to /api/feed  
app.get('/api/events', (req, res) => {
  const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  res.redirect(307, '/api/feed' + qs);
});

// /api/vault (bare) → redirect to /api/vault/recent
app.get('/api/vault', (req, res) => {
  if (!req.url.includes('/vault/')) res.redirect(307, '/api/vault/recent');
});

// /api/queue — alias to /api/proposals for backward compat
// (only if the real /api/queue 404s, which it does now since proposals replaced it)

// /api/stream — unified stream: merge feed + proposals into one timeline
app.get('/api/stream', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const items = [];

    // Get feed events
    const feedEntries = await readFeedLines().catch(() => []);
    feedEntries.reverse();
    feedEntries.slice(0, limit).forEach(e => {
      items.push({
        id: e.id || 'evt_' + Math.random().toString(36).slice(2),
        type: e.type === 'task_complete' ? 'completion' : e.type === 'queue_item_created' ? 'question' : e.type === 'vault_write' ? 'vault' : e.type === 'system_alert' ? 'error' : 'activity',
        streamType: e.type,
        agent: e.agent || 'system',
        title: e.summary || e.type,
        detail: e.detail || '',
        time: e.timestamp || new Date().toISOString(),
        source: 'feed',
        read: false,
      });
    });

    // Get pending proposals
    // Read proposal files directly
    const proposalFiles = await readdir(PROPOSALS_DIR).catch(() => []);
    const proposalItems = [];
    for (const f of proposalFiles) {
      if (!f.endsWith('.json')) continue;
      try { proposalItems.push(JSON.parse(await readFile(join(PROPOSALS_DIR, f), 'utf8'))); } catch {}
    }
    proposalItems.filter(p => p.status === 'pending').slice(0, 20).forEach(p => {
      items.push({
        id: p.id,
        type: 'proposal',
        streamType: 'proposal',
        agent: p.source_agent || 'system',
        title: p.title || 'Proposal',
        detail: p.description || '',
        confidence: p.confidence,
        priority: p.priority,
        time: p.created_at || new Date().toISOString(),
        source: 'proposals',
        read: false,
      });
    });

    // Sort by time descending
    items.sort((a, b) => new Date(b.time) - new Date(a.time));
    res.json(items.slice(0, limit));
  } catch (err) { next(err); }
});

// /api/stream/:id/action
app.post('/api/stream/:id/action', async (req, res, next) => {
  try {
    const { action, message } = req.body;
    console.log(`[stream] Action ${action} on ${req.params.id}: ${message || ''}`);
    res.json({ ok: true, id: req.params.id, action });
  } catch (err) { next(err); }
});

// /api/agent/message
app.post('/api/agent/message', async (req, res, next) => {
  try {
    const { agentId, message } = req.body;
    console.log(`[agent-msg] To ${agentId}: ${message}`);
    res.json({ ok: true, agentId, queued: true });
  } catch (err) { next(err); }
});

// REPLACED BY routes/*.js — kept for reference {{{
// // /api/agents/:id/activity
// app.get('/api/agents/:id/activity', async (req, res, next) => {
//   try {
//     const agentId = req.params.id;
//     const allEvents = await readFeedLines().catch(() => []);
//     const events = allEvents.filter(e => e.agent === agentId).reverse().slice(0, 10);
//     res.json(events);
//   } catch (err) { next(err); }
// });
// }}} END REPLACED BY routes/*.js

// /api/tasks
app.post('/api/tasks', async (req, res, next) => {
  try {
    const { title, agent, priority, description } = req.body;
    console.log(`[task] Created: ${title} → ${agent} (${priority})`);
    res.json({ ok: true, title, agent });
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// Task Lifecycle API — dispatch queue/active/done/failed visibility
// ---------------------------------------------------------------------------
const ACTIVE_DIR = join(DISPATCH, 'active');
const TASK_FAILED_DIR = join(DISPATCH, 'failed');
if (!existsSync(ACTIVE_DIR)) mkdirSync(ACTIVE_DIR, { recursive: true });
if (!existsSync(TASK_FAILED_DIR)) mkdirSync(TASK_FAILED_DIR, { recursive: true });

async function readTaskDir(dir, limit = 50) {
  const results = [];
  try {
    const files = await readdir(dir);
    for (const f of files) {
      if (!f.endsWith('.json') || f === 'index.json') continue;
      try {
        const raw = await readFile(join(dir, f), 'utf8');
        results.push(JSON.parse(raw));
      } catch { /* skip corrupt */ }
    }
  } catch { /* dir may not exist */ }
  results.sort((a, b) => (b.created_at || b.created || '').localeCompare(a.created_at || a.created || ''));
  return results.slice(0, limit);
}

// GET /api/tasks/active
app.get('/api/tasks/active', async (_req, res, next) => {
  try {
    const items = await readTaskDir(ACTIVE_DIR);
    res.json(items.map(i => ({ ...i, status: i.status || 'active' })));
  } catch (err) { next(err); }
});

// GET /api/tasks/queue
app.get('/api/tasks/queue', async (_req, res, next) => {
  try {
    const items = await readTaskDir(QUEUE_DIR);
    res.json(items.map(i => ({ ...i, status: i.status || 'queued' })));
  } catch (err) { next(err); }
});

// GET /api/tasks/done
app.get('/api/tasks/done', async (_req, res, next) => {
  try {
    const items = await readTaskDir(DONE_DIR, 20);
    res.json(items.map(i => ({ ...i, status: i.status || 'done' })));
  } catch (err) { next(err); }
});

// GET /api/tasks/failed
app.get('/api/tasks/failed', async (_req, res, next) => {
  try {
    const items = await readTaskDir(TASK_FAILED_DIR, 10);
    res.json(items.map(i => ({ ...i, status: i.status || 'failed' })));
  } catch (err) { next(err); }
});

// GET /api/tasks/all — combined view with status
app.get('/api/tasks/all', async (_req, res, next) => {
  try {
    const [queued, active, done, failed] = await Promise.all([
      readTaskDir(QUEUE_DIR).then(items => items.map(i => ({ ...i, status: 'queued' }))),
      readTaskDir(ACTIVE_DIR).then(items => items.map(i => ({ ...i, status: 'active' }))),
      readTaskDir(DONE_DIR, 20).then(items => items.map(i => ({ ...i, status: i.status || 'done' }))),
      readTaskDir(TASK_FAILED_DIR, 10).then(items => items.map(i => ({ ...i, status: i.status || 'failed' }))),
    ]);
    const all = [...active, ...queued, ...done, ...failed];
    all.sort((a, b) => (b.created_at || b.created || '').localeCompare(a.created_at || a.created || ''));
    res.json(all);
  } catch (err) { next(err); }
});

// GET /api/tasks/:id — single task detail with source proposal
app.get('/api/tasks/:id', async (req, res, next) => {
  try {
    const taskId = req.params.id;
    let task = null;
    let foundIn = null;

    // Search across all task directories
    for (const [dir, status] of [[QUEUE_DIR, 'queued'], [ACTIVE_DIR, 'active'], [DONE_DIR, 'done'], [TASK_FAILED_DIR, 'failed']]) {
      try {
        const files = await readdir(dir);
        for (const f of files) {
          if (!f.endsWith('.json') || f === 'index.json') continue;
          const filePath = join(dir, f);
          try {
            const raw = await readFile(filePath, 'utf8');
            const t = JSON.parse(raw);
            if (t.id === taskId || f === `${taskId}.json`) {
              task = { ...t, status: t.status || status };
              foundIn = dir;
              break;
            }
          } catch { /* skip corrupt */ }
        }
        if (task) break;
      } catch { /* dir may not exist */ }
    }

    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Try to fetch source proposal if task.proposal_id exists
    if (task.proposal_id) {
      try {
        const propPath = join(PROPOSALS_DIR, `${task.proposal_id}.json`);
        const propRaw = await readFile(propPath, 'utf8');
        task.source_proposal = JSON.parse(propRaw);
      } catch { /* proposal may not exist */ }
    }

    res.json(task);
  } catch (err) { next(err); }
});

// POST /api/tasks/:id/cancel — move task from queue/active to failed
app.post('/api/tasks/:id/cancel', async (req, res, next) => {
  try {
    const taskId = req.params.id;
    let task = null;
    let srcPath = null;

    // Find task in queue or active
    for (const dir of [QUEUE_DIR, ACTIVE_DIR]) {
      try {
        const files = await readdir(dir);
        for (const f of files) {
          if (!f.endsWith('.json') || f === 'index.json') continue;
          const filePath = join(dir, f);
          try {
            const raw = await readFile(filePath, 'utf8');
            const t = JSON.parse(raw);
            if (t.id === taskId || f === `${taskId}.json`) {
              task = t;
              srcPath = filePath;
              break;
            }
          } catch { /* skip */ }
        }
        if (task) break;
      } catch { /* dir may not exist */ }
    }

    if (!task || !srcPath) return res.status(404).json({ error: 'Task not found in queue or active' });

    task.status = 'failed';
    task.error = req.body.reason || 'Cancelled by user';
    task.failed_at = new Date().toISOString();

    const dstPath = join(TASK_FAILED_DIR, basename(srcPath));
    await writeFile(dstPath, JSON.stringify(task, null, 2));
    await unlink(srcPath).catch(() => {});

    broadcast({ type: 'task', action: 'cancelled', data: task });
    res.json(task);
  } catch (err) { next(err); }
});

// POST /api/tasks/:id/retry — copy failed task back to queue
app.post('/api/tasks/:id/retry', async (req, res, next) => {
  try {
    const taskId = req.params.id;
    let task = null;
    let srcPath = null;

    // Find task in failed or done
    for (const dir of [TASK_FAILED_DIR, DONE_DIR]) {
      try {
        const files = await readdir(dir);
        for (const f of files) {
          if (!f.endsWith('.json') || f === 'index.json') continue;
          const filePath = join(dir, f);
          try {
            const raw = await readFile(filePath, 'utf8');
            const t = JSON.parse(raw);
            if (t.id === taskId || f === `${taskId}.json`) {
              task = t;
              srcPath = filePath;
              break;
            }
          } catch { /* skip */ }
        }
        if (task) break;
      } catch { /* dir may not exist */ }
    }

    if (!task || !srcPath) return res.status(404).json({ error: 'Task not found in failed or done' });

    // Reset task state
    const retryId = `${task.id || taskId}-retry-${Date.now()}`;
    const retryTask = {
      ...task,
      id: retryId,
      status: 'queued',
      created_at: new Date().toISOString(),
      error: undefined,
      failed_at: undefined,
      completed_at: undefined,
      output: undefined,
      result: undefined,
      retry_of: task.id || taskId,
    };
    delete retryTask.error;
    delete retryTask.failed_at;
    delete retryTask.completed_at;
    delete retryTask.output;
    delete retryTask.result;

    await writeFile(join(QUEUE_DIR, `${retryId}.json`), JSON.stringify(retryTask, null, 2));

    broadcast({ type: 'task', action: 'retried', data: retryTask });
    res.json(retryTask);
  } catch (err) { next(err); }
});

// POST /api/tasks/:id/priority — update task priority
app.post('/api/tasks/:id/priority', async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const { priority } = req.body;
    if (!priority) return res.status(400).json({ error: 'priority required' });

    // Find task in queue (only queued tasks can have priority changed)
    let task = null;
    let filePath = null;

    try {
      const files = await readdir(QUEUE_DIR);
      for (const f of files) {
        if (!f.endsWith('.json') || f === 'index.json') continue;
        const fp = join(QUEUE_DIR, f);
        try {
          const raw = await readFile(fp, 'utf8');
          const t = JSON.parse(raw);
          if (t.id === taskId || f === `${taskId}.json`) {
            task = t;
            filePath = fp;
            break;
          }
        } catch { /* skip */ }
      }
    } catch { /* dir may not exist */ }

    if (!task || !filePath) return res.status(404).json({ error: 'Task not found in queue' });

    task.priority = priority;
    task.updated_at = new Date().toISOString();
    await writeFile(filePath, JSON.stringify(task, null, 2));

    broadcast({ type: 'task', action: 'priority_changed', data: task });
    res.json(task);
  } catch (err) { next(err); }
});

// REPLACED BY routes/*.js — kept for reference {{{
// // POST /api/proposals/:id/approve-and-track — approve + return task tracking info
// app.post('/api/proposals/:id/approve-and-track', async (req, res, next) => {
//   try {
//     const { option } = req.body;
//     const { execSync } = await import('child_process');
//     const proposalSh = join(process.env.HOME, 'bin', 'proposal.sh');

//     try {
//       execSync(`${proposalSh} approve "${req.params.id}" "${option || 'approve'}"`, { timeout: 10000 });
//     } catch (err) {
//       return res.status(500).json({ error: `proposal.sh failed: ${err.message}` });
//     }

//     // Read updated proposal
//     const filePath = join(PROPOSALS_DIR, `${req.params.id}.json`);
//     const raw = await readFile(filePath, 'utf8');
//     const item = JSON.parse(raw);

//     // Find the task that was created (check queue for recent task matching proposal)
//     let taskId = null;
//     try {
//       const queueFiles = await readdir(QUEUE_DIR);
//       for (const f of queueFiles) {
//         if (!f.endsWith('.json') || f === 'index.json') continue;
//         try {
//           const taskRaw = await readFile(join(QUEUE_DIR, f), 'utf8');
//           const task = JSON.parse(taskRaw);
//           if (task.proposal_id === req.params.id || (task.title && item.title && task.title.includes(item.title.substring(0, 30)))) {
//             taskId = task.id || f.replace('.json', '');
//             break;
//           }
//         } catch {}
//       }
//     } catch {}

//     // Post to feed
//     const feedEntry = {
//       id: `f-approve-${Date.now()}`,
//       agent: 'system',
//       type: 'proposal_approved',
//       content: `Proposal approved → Task created: ${item.title || req.params.id}`,
//       timestamp: new Date().toISOString(),
//     };
//     await appendJsonl(FEED_PATH, feedEntry);

//     broadcast({ type: 'proposal', action: 'approved', data: { ...item, taskId } });
//     broadcast({ type: 'feed', data: feedEntry });

//     res.json({ proposal: item, taskId, status: 'approved' });
//   } catch (err) {
//     if (err.code === 'ENOENT') return res.status(404).json({ error: 'Proposal not found' });
//     next(err);
//   }
// });
// }}} END REPLACED BY routes/*.js

// GET /api/discord/recent — recent messages from agent-feed channel
app.get('/api/discord/recent', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 50);
    // Try to find the agent-feed channel ID
    const AGENT_FEED_CHANNEL = process.env.DISCORD_AGENT_FEED_CHANNEL || '';
    let channelId = AGENT_FEED_CHANNEL;

    // If not configured, try to find it from channel-ids.json
    if (!channelId) {
      try {
        const raw = await readFile(CHANNEL_IDS_PATH, 'utf8');
        const channels = JSON.parse(raw);
        channelId = channels['agent-feed'] || channels['🤖-agent-feed'] || '';
      } catch {}
    }

    // Fallback: search guild channels for agent-feed
    if (!channelId) {
      try {
        const guildId = process.env.DISCORD_GUILD_ID || '1482230800916287710';
        const allChannels = await discordFetch(`/guilds/${guildId}/channels`);
        const feedCh = allChannels.find(c => c.name.includes('agent-feed'));
        if (feedCh) channelId = feedCh.id;
      } catch {}
    }

    if (!channelId) {
      return res.json([]); // No channel configured/found
    }

    const messages = await discordFetch(`/channels/${channelId}/messages?limit=${limit}`);
    const normalized = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      author: msg.author.global_name || msg.author.username,
      authorBot: msg.author.bot || false,
      timestamp: msg.timestamp,
      channel: 'agent-feed',
    }));
    res.json(normalized);
  } catch (err) {
    // Return empty on Discord errors rather than failing
    console.warn('[discord/recent] Error:', err.message);
    res.json([]);
  }
});

// ---------------------------------------------------------------------------
// Projects API — Derive projects from dispatch/vault data
// ---------------------------------------------------------------------------

// GET /api/projects
app.get('/api/projects', async (_req, res, next) => {
  try {
    const PROJECTS_DIR = join(process.env.HOME, 'projects');
    const projects = [];

    // 1. Try reading formal project files from ~/projects/
    if (existsSync(PROJECTS_DIR)) {
      try {
        const files = await readdir(PROJECTS_DIR);
        for (const f of files) {
          if (!f.endsWith('.json')) continue;
          try {
            const raw = await readFile(join(PROJECTS_DIR, f), 'utf8');
            const proj = JSON.parse(raw);
            if (proj.id || proj.name) projects.push(proj);
          } catch { /* skip bad files */ }
        }
      } catch { /* dir read error */ }
    }

    // 2. If no formal projects, derive from dispatch data
    if (projects.length === 0) {
      // Read all tasks to group by patterns
      const [queued, active, done, failed] = await Promise.all([
        readTaskDir(QUEUE_DIR).catch(() => []),
        readTaskDir(ACTIVE_DIR).catch(() => []),
        readTaskDir(DONE_DIR, 100).catch(() => []),
        readTaskDir(TASK_FAILED_DIR, 50).catch(() => []),
      ]);
      const allTasks = [...queued, ...active, ...done, ...failed];

      // Read goals for mission cross-reference
      const goals = await readJsonDir(GOALS_DIR, ['index.json']).catch(() => []);

      // Group tasks by common prefixes/keywords in title
      const groups = {};
      allTasks.forEach(t => {
        const title = (t.title || t.task || '').toLowerCase();
        // Extract project-like keywords
        let group = null;
        if (title.includes('agent os') || title.includes('frontend') || title.includes('demo')) group = 'agent-os';
        else if (title.includes('vault') || title.includes('knowledge') || title.includes('qmd')) group = 'vault-knowledge';
        else if (title.includes('dispatch') || title.includes('proposal') || title.includes('queue')) group = 'dispatch-v2';
        else if (title.includes('bridge') || title.includes('server')) group = 'bridge-infra';
        else if (title.includes('security') || title.includes('oauth') || title.includes('audit')) group = 'security';
        if (group) {
          if (!groups[group]) groups[group] = { queued: [], active: [], done: [], failed: [] };
          const status = t.status || 'queued';
          if (groups[group][status]) groups[group][status].push(t);
        }
      });

      // Build projects from groups
      const groupMeta = {
        'agent-os': { name: 'Agent OS Frontend', desc: 'Ship the native web UI for Agent OS', mission: 'ship-agent-os' },
        'vault-knowledge': { name: 'Vault Knowledge System', desc: 'Build and maintain the knowledge graph from vault notes', mission: null },
        'dispatch-v2': { name: 'Dispatch System v2', desc: 'Next-gen dispatch with proposal engine and auto-triage', mission: null },
        'bridge-infra': { name: 'Bridge Infrastructure', desc: 'API bridge between frontend and agent system', mission: null },
        'security': { name: 'Security & Auth', desc: 'OAuth, security audits, and access control', mission: null },
      };

      for (const [groupId, tasks] of Object.entries(groups)) {
        const meta = groupMeta[groupId] || { name: groupId, desc: '', mission: null };
        const activeTasks = tasks.active || [];
        const doneTasks = tasks.done || [];
        const queuedTasks = tasks.queued || [];
        const failedTasks = tasks.failed || [];
        const allGroupTasks = [...queuedTasks, ...activeTasks, ...doneTasks, ...failedTasks];

        // Find latest activity
        const timestamps = allGroupTasks
          .map(t => t.created_at || t.completed_at || t.created || '')
          .filter(Boolean)
          .sort()
          .reverse();

        // Count vault notes by searching (simple heuristic)
        let vaultNotes = 0;
        try {
          const searchTerm = meta.name.split(' ').slice(0, 2).join(' ');
          const stdout = await execPromise('/usr/bin/qmd', ['search', searchTerm, '--limit', '20', '--json']).catch(() => '[]');
          try { vaultNotes = JSON.parse(stdout).length; } catch { vaultNotes = 0; }
        } catch { /* qmd not available */ }

        // Determine status
        let status = 'active';
        if (activeTasks.length === 0 && queuedTasks.length === 0 && doneTasks.length > 0) status = 'complete';
        else if (activeTasks.length === 0 && queuedTasks.length > 0) status = 'planning';

        projects.push({
          id: groupId,
          name: meta.name,
          description: meta.desc,
          status,
          tasks_active: activeTasks.length + queuedTasks.length,
          tasks_done: doneTasks.length,
          vault_notes: vaultNotes,
          mission: meta.mission,
          last_activity: timestamps[0] || new Date().toISOString(),
          created_at: timestamps[timestamps.length - 1] || new Date().toISOString(),
        });
      }

      // If still empty after derivation, return curated fallback
      if (projects.length === 0) {
        const now = new Date().toISOString();
        projects.push(
          { id: 'agent-os', name: 'Agent OS Frontend', status: 'active', description: 'Ship the native web UI', tasks_active: 6, tasks_done: 12, vault_notes: 8, mission: 'ship-agent-os', last_activity: now, created_at: now },
          { id: 'vault-knowledge', name: 'Vault Knowledge System', status: 'active', description: 'Knowledge graph from vault notes', tasks_active: 2, tasks_done: 5, vault_notes: 15, mission: null, last_activity: now, created_at: now },
          { id: 'dispatch-v2', name: 'Dispatch System v2', status: 'planning', description: 'Next-gen dispatch with proposal engine', tasks_active: 0, tasks_done: 3, vault_notes: 4, mission: null, last_activity: now, created_at: now },
        );
      }
    }

    // Sort: active first, then by task count
    projects.sort((a, b) => {
      const statusOrder = { active: 0, review: 1, planning: 2, paused: 3, complete: 4 };
      const sa = statusOrder[a.status] ?? 2;
      const sb = statusOrder[b.status] ?? 2;
      if (sa !== sb) return sa - sb;
      return (b.tasks_active || 0) - (a.tasks_active || 0);
    });

    res.json(projects);
  } catch (err) { next(err); }
});

// POST /api/projects — save a new project
app.post('/api/projects', async (req, res, next) => {
  try {
    const PROJECTS_DIR = join(process.env.HOME, 'projects');
    if (!existsSync(PROJECTS_DIR)) mkdirSync(PROJECTS_DIR, { recursive: true });

    const project = req.body;
    if (!project.id && !project.name) return res.status(400).json({ error: 'name required' });

    const id = project.id || project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const data = {
      ...project,
      id,
      created_at: project.created_at || new Date().toISOString(),
    };

    await writeFile(join(PROJECTS_DIR, `${id}.json`), JSON.stringify(data, null, 2));
    broadcast({ type: 'project', action: 'created', data });
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------
app.use((err, _req, res, _next) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: err.message });
});

// ---------------------------------------------------------------------------
// HTTP + WebSocket server
// ---------------------------------------------------------------------------
const server = createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Set();
const subscribedChannels = new Set(); // Dynamically subscribed channel IDs from WebUI clients

wss.on('connection', (ws) => {
  clients.add(ws);

  // Send wiki status on connect (non-blocking)
  getWikiHealth().then(health => {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'wiki_status', data: health }));
    }
  }).catch(() => {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'wiki_status', data: { healthy: false, page_count: 0, last_indexed: null } }));
    }
  });

  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'subscribe' && msg.channel && /^\d+$/.test(msg.channel)) {
        subscribedChannels.add(msg.channel);
      }
      // Wiki search over WebSocket
      if (msg.type === 'wiki_search') {
        const query = msg.query || '';
        const options = msg.options || {};
        try {
          const results = await wikiSearch(query, options);
          if (ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'wiki_search_result', id: msg.id, data: results }));
          }
        } catch (err) {
          if (ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'wiki_search_result', id: msg.id, error: err.message, data: null }));
          }
        }
      }
    } catch {}
  });
  ws.on('close', () => clients.delete(ws));
  ws.on('error', () => clients.delete(ws));
});

function broadcast(msg) {
  const payload = JSON.stringify(msg);
  for (const ws of clients) {
    if (ws.readyState === 1) { // OPEN
      ws.send(payload);
    }
  }
}

// ---------------------------------------------------------------------------
// Discord polling (per active channel)
// ---------------------------------------------------------------------------
const lastMessageIds = new Map(); // channelId -> lastMessageId

async function pollDiscordChannels() {
  try {
    const raw = await readFile(CHANNEL_IDS_PATH, 'utf8');
    const channels = JSON.parse(raw);

    // Merge dynamically subscribed channels from WebUI clients
    for (const subId of subscribedChannels) {
      const alreadyTracked = Object.values(channels).includes(subId);
      if (!alreadyTracked) channels[`sub-${subId}`] = subId;
    }

    const entries = Object.entries(channels);
    for (let i = 0; i < entries.length; i++) {
      const [name, id] = entries[i];
      if (i > 0) await new Promise(r => setTimeout(r, 200)); // stagger to avoid rate limits
      try {
        const messages = await discordFetch(`/channels/${id}/messages?limit=5`);
        if (!Array.isArray(messages) || messages.length === 0) continue;

        const newestId = messages[0]?.id;
        const lastKnown = lastMessageIds.get(id);

        if (newestId && newestId !== lastKnown) {
          lastMessageIds.set(id, newestId);
          if (lastKnown) { // skip first poll (don't flood on startup)
            const newMessages = [];
            for (const msg of messages) {
              if (msg.id === lastKnown) break;
              newMessages.push({
                id: msg.id,
                content: msg.content,
                author: {
                  id: msg.author.id,
                  username: msg.author.username,
                  display_name: msg.author.global_name || msg.author.username,
                  avatar: msg.author.avatar,
                  bot: msg.author.bot || false,
                },
                timestamp: msg.timestamp,
                attachments: msg.attachments || [],
                embeds: msg.embeds || [],
                reactions: (msg.reactions || []).map(r => ({
                  emoji: r.emoji.name,
                  count: r.count,
                })),
                referenced_message: msg.referenced_message ? {
                  id: msg.referenced_message.id,
                  content: msg.referenced_message.content?.substring(0, 100),
                  author: msg.referenced_message.author?.username,
                } : null,
              });
            }
            for (const m of newMessages) {
              broadcast({ type: 'message', channel: id, data: m });
            }
          }
        }
      } catch {
        // Don't log every poll failure
      }
    }
  } catch {
    // channel-ids.json might not exist yet
  }
}

// Only poll if we have connected WebSocket clients
let pollTimer = null;
let discordFailCount = 0;

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    if (clients.size > 0 && discordFailCount < 3) {
      pollDiscordChannels().catch(() => {
        discordFailCount++;
        if (discordFailCount >= 3) console.log('[discord] Polling disabled after 3 failures — Discord not connected');
      });
    }
  }, POLL_INTERVAL_MS);
}

// ---------------------------------------------------------------------------
// Missions API (Goals, Queue, Done, Failed, Feed, Schedule, Stats)
// ---------------------------------------------------------------------------
const GOALS_DIR = join(DISPATCH, 'goals');
const GOALS_ARCHIVE_DIR = join(DISPATCH, 'goals', 'archive');
const FAILED_DIR = join(DISPATCH, 'failed');
const SCHEDULE_PATH = join(DISPATCH, 'schedule.json');

async function readJsonDir(dir, exclude = []) {
  const results = [];
  try {
    const files = await readdir(dir);
    for (const f of files) {
      if (!f.endsWith('.json') || exclude.includes(f)) continue;
      try {
        const raw = await readFile(join(dir, f), 'utf8');
        results.push(JSON.parse(raw));
      } catch { /* skip bad files */ }
    }
  } catch { /* dir may not exist */ }
  return results;
}

// ---------------------------------------------------------------------------
// Missions API — Enriched composite endpoints for frontend
// ---------------------------------------------------------------------------

// GET /api/missions — enriched mission list from goals + dispatch data
app.get('/api/missions', async (_req, res, next) => {
  try {
    // 1. Read goals from dispatch/goals
    const goals = await readJsonDir(GOALS_DIR, ['index.json']);
    
    // 2. Read dispatch tasks for cross-reference
    const [queueTasks, activeTasks, doneTasks, failedTasks] = await Promise.all([
      readTaskDir(QUEUE_DIR),
      readTaskDir(ACTIVE_DIR),
      readTaskDir(DONE_DIR, 100),
      readTaskDir(TASK_FAILED_DIR, 50),
    ]);
    const allTasks = [...queueTasks, ...activeTasks, ...doneTasks, ...failedTasks];
    
    // 3. Build enriched missions from goals
    const missions = goals.map(g => {
      const id = g.id || g.name || 'unknown';
      const title = g.description || g.title || g.name || 'Untitled Goal';
      const steps = g.steps || [];
      const doneSteps = steps.filter(s => s.status === 'done' || s.status === 'completed');
      const activeSteps = steps.filter(s => s.status === 'active' || s.status === 'in_progress');
      
      // Find related dispatch tasks (match by goal id or description keywords)
      const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const relatedTasks = allTasks.filter(t => {
        const taskText = ((t.title || '') + ' ' + (t.description || '') + ' ' + (t.task || '') + ' ' + (t.context || '')).toLowerCase();
        return taskText.includes(id.toLowerCase()) || titleWords.some(w => taskText.includes(w));
      });
      const relatedDone = relatedTasks.filter(t => t.status === 'done' || t.status === 'completed');
      const relatedActive = relatedTasks.filter(t => t.status === 'active');
      
      // Calculate totals from steps + related tasks
      const tasksTotal = Math.max(steps.length, relatedTasks.length, 1);
      const tasksDone = Math.max(doneSteps.length, relatedDone.length);
      const progress = steps.length > 0 
        ? Math.round((doneSteps.length / steps.length) * 100)
        : (relatedTasks.length > 0 ? Math.round((relatedDone.length / relatedTasks.length) * 100) : 0);
      
      // Days active
      const created = new Date(g.created_at || Date.now());
      const daysActive = Math.max(1, Math.ceil((Date.now() - created.getTime()) / 86400000));
      
      // Unique agents
      const agentSet = new Set();
      steps.forEach(s => { if (s.agent) agentSet.add(s.agent); });
      relatedActive.forEach(t => { if (t.agent) agentSet.add(t.agent); });
      
      // Velocity (tasks/day)
      const velocity = daysActive > 0 ? parseFloat((tasksDone / daysActive).toFixed(1)) : 0;
      
      // Milestones from steps
      const milestones = steps.map(s => {
        const done = s.status === 'done' || s.status === 'completed';
        const label = (s.description || s.name || 'Step').substring(0, 30);
        return done ? label + ' ✓' : label;
      });
      
      // Determine status
      let status = g.status || 'active';
      if (progress >= 100) status = 'completed';
      else if (progress === 0 && daysActive <= 1) status = 'planned';
      
      // Icon from description keywords
      let icon = '🎯';
      const desc = title.toLowerCase();
      if (desc.includes('security') || desc.includes('audit')) icon = '🔒';
      else if (desc.includes('frontend') || desc.includes('ui') || desc.includes('build')) icon = '🏗️';
      else if (desc.includes('research') || desc.includes('compet')) icon = '🔬';
      else if (desc.includes('vault') || desc.includes('knowledge')) icon = '🧠';
      else if (desc.includes('revenue') || desc.includes('money') || desc.includes('client')) icon = '💰';
      else if (desc.includes('dispatch') || desc.includes('engine')) icon = '📋';
      
      return {
        id,
        icon,
        title,
        desc: g.description || '',
        goal: g.category || g.goal || '',
        status,
        progress: Math.min(100, progress),
        tasks_done: tasksDone,
        tasks_total: tasksTotal,
        agents_active: agentSet.size,
        days_active: daysActive,
        velocity,
        milestones: milestones.slice(0, 6),
        blocking_items: 0,
        target_date: g.deadline || '',
        success_criteria: g.success_criteria || '',
        created_at: g.created_at,
      };
    });
    
    // If no goals exist, build missions from dispatch task patterns
    if (missions.length === 0) {
      // Group queue/active tasks by source or keyword patterns
      const taskGroups = {};
      [...queueTasks, ...activeTasks].forEach(t => {
        const key = t.source || 'general';
        if (!taskGroups[key]) taskGroups[key] = [];
        taskGroups[key].push(t);
      });
      
      Object.entries(taskGroups).forEach(([source, tasks]) => {
        missions.push({
          id: 'auto-' + source.replace(/\s+/g, '-').toLowerCase(),
          icon: '📋',
          title: source.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          desc: `${tasks.length} tasks from ${source}`,
          goal: '',
          status: 'active',
          progress: 0,
          tasks_done: 0,
          tasks_total: tasks.length,
          agents_active: new Set(tasks.map(t => t.agent).filter(Boolean)).size,
          days_active: 1,
          velocity: 0,
          milestones: [],
          blocking_items: 0,
          target_date: '',
          success_criteria: '',
        });
      });
    }
    
    // Sort: active first, then by progress desc
    missions.sort((a, b) => {
      const statusOrder = { active: 0, planned: 1, completed: 2 };
      const sa = statusOrder[a.status] ?? 1;
      const sb = statusOrder[b.status] ?? 1;
      if (sa !== sb) return sa - sb;
      return b.progress - a.progress;
    });
    
    res.json(missions);
  } catch (err) { next(err); }
});

// GET /api/missions/:id — single mission detail with related data
app.get('/api/missions/:id', async (req, res, next) => {
  try {
    const missionId = req.params.id;
    
    // Find the goal file
    const goals = await readJsonDir(GOALS_DIR, ['index.json']);
    const goal = goals.find(g => g.id === missionId);
    if (!goal) return res.status(404).json({ error: 'Mission not found' });
    
    // Related dispatch tasks
    const [queueTasks, activeTasks, doneTasks] = await Promise.all([
      readTaskDir(QUEUE_DIR),
      readTaskDir(ACTIVE_DIR),
      readTaskDir(DONE_DIR, 50),
    ]);
    
    const titleWords = (goal.description || goal.title || '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const relatedTasks = [...queueTasks, ...activeTasks, ...doneTasks].filter(t => {
      const taskText = ((t.title || '') + ' ' + (t.description || '') + ' ' + (t.task || '') + ' ' + (t.context || '')).toLowerCase();
      return taskText.includes(missionId.toLowerCase()) || titleWords.some(w => taskText.includes(w));
    });
    
    // Search vault for related notes
    let vaultNotes = [];
    try {
      const searchTerm = (goal.description || goal.title || '').split(/\s+/).slice(0, 3).join(' ');
      if (searchTerm) {
        const stdout = await execPromise('/usr/bin/qmd', ['search', searchTerm, '--limit', '5', '--json']);
        try { vaultNotes = JSON.parse(stdout); } catch { vaultNotes = []; }
      }
    } catch { /* qmd not available */ }
    
    // Activity timeline from feed
    let timeline = [];
    try {
      const feedEntries = await readFeedLines();
      const goalWords = titleWords.slice(0, 3);
      timeline = feedEntries.filter(e => {
        const text = ((e.content || '') + ' ' + (e.detail || '')).toLowerCase();
        return goalWords.some(w => text.includes(w));
      }).slice(-20).reverse().map(e => ({
        timestamp: e.timestamp,
        agent: e.agent,
        type: e.type,
        text: e.content || e.detail || '',
      }));
    } catch { /* no feed */ }
    
    res.json({
      ...goal,
      related_tasks: relatedTasks.slice(0, 20),
      vault_notes: vaultNotes.slice(0, 5),
      timeline,
    });
  } catch (err) { next(err); }
});

// POST /api/missions — create a new goal/mission
app.post('/api/missions', async (req, res, next) => {
  try {
    const { title, description, deadline, category } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    
    const { execSync } = await import('child_process');
    const goalsSh = join(process.env.HOME, 'bin', 'goals.sh');
    const desc = (description || title).replace(/"/g, '\\"');
    const dl = deadline || '';
    
    let id;
    try {
      const output = execSync(`${goalsSh} create "${desc}" "${dl}"`, { timeout: 10000, encoding: 'utf8' });
      const idMatch = output.match(/(goal-\S+)/);
      id = idMatch ? idMatch[1] : null;
    } catch (err) {
      // Fallback: create directly
      const crypto = await import('crypto');
      id = 'goal-' + crypto.randomBytes(4).toString('hex');
      const now = new Date().toISOString();
      const goalData = {
        id,
        description: desc,
        title: title,
        category: category || '',
        created_at: now,
        deadline: deadline || null,
        status: 'active',
        steps: [],
        auto_dispatch: true,
        last_checked: null,
      };
      await writeFile(join(GOALS_DIR, `${id}.json`), JSON.stringify(goalData, null, 2));
    }
    
    if (id) {
      // Read the created goal
      try {
        const raw = await readFile(join(GOALS_DIR, `${id}.json`), 'utf8');
        const goal = JSON.parse(raw);
        broadcast({ type: 'mission', action: 'created', data: goal });
        res.status(201).json(goal);
      } catch {
        res.status(201).json({ id, title, status: 'created' });
      }
    } else {
      res.status(201).json({ title, status: 'created' });
    }
  } catch (err) { next(err); }
});

// GET /api/missions/goals
app.get('/api/missions/goals', async (_req, res, next) => {
  try {
    const goals = await readJsonDir(GOALS_DIR, ['index.json']);
    goals.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    res.json(goals);
  } catch (err) { next(err); }
});

// GET /api/missions/goals/archive
app.get('/api/missions/goals/archive', async (_req, res, next) => {
  try {
    const goals = await readJsonDir(GOALS_ARCHIVE_DIR);
    goals.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    res.json(goals);
  } catch (err) { next(err); }
});

// GET /api/missions/queue
app.get('/api/missions/queue', async (_req, res, next) => {
  try {
    // Read all individual queue files (index.json is often stale)
    const items = await readJsonDir(QUEUE_DIR, ['index.json']);
    items.sort((a, b) => (a.priority ?? 4) - (b.priority ?? 4));
    res.json(items);
  } catch (err) { next(err); }
});

// GET /api/missions/done?limit=20
app.get('/api/missions/done', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '20', 10);
    let items = await readJsonDir(DONE_DIR);
    items.sort((a, b) => (b.completed_at || b.created_at || '').localeCompare(a.completed_at || a.created_at || ''));
    res.json(items.slice(0, limit));
  } catch (err) { next(err); }
});

// GET /api/missions/failed
app.get('/api/missions/failed', async (_req, res, next) => {
  try {
    const items = await readJsonDir(FAILED_DIR);
    items.sort((a, b) => (b.failed_at || b.created_at || '').localeCompare(a.failed_at || a.created_at || ''));
    res.json(items);
  } catch (err) { next(err); }
});

// GET /api/missions/schedule
app.get('/api/missions/schedule', async (_req, res, next) => {
  try {
    const raw = await readFile(SCHEDULE_PATH, 'utf8');
    res.json(JSON.parse(raw));
  } catch (err) {
    if (err.code === 'ENOENT') return res.json([]);
    next(err);
  }
});

// GET /api/missions/feed?limit=50
app.get('/api/missions/feed', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const raw = await readFile(FEED_PATH, 'utf8');
    const lines = raw.trim().split('\n').filter(Boolean);
    const entries = [];
    for (const line of lines.slice(-limit)) {
      try { entries.push(JSON.parse(line)); } catch { /* skip */ }
    }
    entries.reverse(); // newest first
    res.json(entries);
  } catch (err) {
    if (err.code === 'ENOENT') return res.json([]);
    next(err);
  }
});

// GET /api/missions/stats
app.get('/api/missions/stats', async (_req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const queue = await readJsonDir(QUEUE_DIR, ['index.json']);
    const done = await readJsonDir(DONE_DIR);
    const failed = await readJsonDir(FAILED_DIR);
    const goals = await readJsonDir(GOALS_DIR, ['index.json']);

    const doneToday = done.filter(d => (d.completed_at || '').startsWith(today)).length;
    const failedToday = failed.filter(f => (f.failed_at || '').startsWith(today)).length;
    const activeGoals = goals.filter(g => g.status !== 'archived' && g.status !== 'completed').length;
    const totalProcessed = done.length + failed.length;
    const completionRate = totalProcessed > 0 ? Math.round((done.length / totalProcessed) * 100) : 0;

    res.json({
      queueDepth: queue.length,
      doneToday,
      failedToday,
      activeGoals,
      completionRate,
      totalDone: done.length,
      totalFailed: failed.length,
    });
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// Queue directory watcher
// ---------------------------------------------------------------------------
async function watchQueueDir() {
  try {
    const { watch: fsWatch } = await import('fs');
    const watcher = fsWatch(QUEUE_DIR, (eventType, filename) => {
      if (!filename?.endsWith('.json') || filename === 'index.json') return;
      setTimeout(async () => {
        try {
          const filePath = join(QUEUE_DIR, filename);
          const raw = await readFile(filePath, 'utf8');
          const item = JSON.parse(raw);
          broadcast({ type: 'queue', action: 'new', data: item });
        } catch { /* file might have been moved/deleted */ }
        await rebuildQueueIndex().catch(() => {});
      }, 200);
    });
    watcher.on('error', (err) => {
      console.error('[watch] queue dir watch error:', err.message);
    });
    console.log('[watch] watching queue dir');
  } catch (err) {
    console.error('[watch] queue dir watch failed:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Life OS API — Executive Functioning Dashboard
// ---------------------------------------------------------------------------
const DATA_DIR = join(process.env.HOME, 'data');

async function readJsonFile(filename) {
  try {
    const raw = await readFile(join(DATA_DIR, filename), 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function writeJsonFile(filename, data) {
  await writeFile(join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

// GET /api/life/dashboard — aggregate view
app.get('/api/life/dashboard', async (_req, res, next) => {
  try {
    const [goals, schedule, reminders, energy, brainDumps, focus, dailyPlans, initiatives] = await Promise.all([
      readJsonFile('goals.json'),
      readJsonFile('schedule.json'),
      readJsonFile('reminders.json'),
      readJsonFile('energy-log.json'),
      readJsonFile('brain-dumps.json'),
      readJsonFile('focus-sessions.json'),
      readJsonFile('daily-plans.json'),
      readJsonFile('initiatives.json'),
    ]);

    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    // Today's schedule blocks
    const todayBlocks = (schedule || []).filter(b => (b.start || '').startsWith(today));

    // Active goals count
    const activeGoals = (goals?.goals || []).filter(g => g.status === 'active').length;

    // Due reminders (not cancelled, due within 24h)
    const dueReminders = (reminders || []).filter(r => {
      if (r.status === 'cancelled' || r.status === 'fired') return false;
      const due = new Date(r.due_at);
      return due <= new Date(now.getTime() + 24 * 60 * 60 * 1000);
    });

    // Recent energy (last 7 readings)
    const recentEnergy = (energy || []).slice(-7);

    // Active focus session
    const activeFocus = focus?.current || null;

    // Brain dump count (unprocessed)
    const unprocessedDumps = (brainDumps || []).filter(d => !d.processed).length;

    // Today's daily plan
    const todayPlan = (dailyPlans || []).find(p => (p.date || '').startsWith(today));

    // Focus stats for today
    const todaySessions = (focus?.sessions || []).filter(s => (s.started_at || '').startsWith(today));
    const deepWorkMin = focus?.daily_deep_work_min?.[today] || 0;

    res.json({
      schedule: todayBlocks,
      activeGoals,
      dueReminders,
      energyTrend: recentEnergy,
      activeFocus,
      brainDumpCount: unprocessedDumps,
      dailyPlan: todayPlan || null,
      focusStats: {
        sessionsToday: todaySessions.length,
        deepWorkMin,
      },
      initiatives: (initiatives || []).filter(i => i.status !== 'done'),
    });
  } catch (err) { next(err); }
});

// GET /api/life/goals
app.get('/api/life/goals', async (_req, res, next) => {
  try {
    const data = await readJsonFile('goals.json');
    res.json(data || { goals: [], projects: [], tasks: [] });
  } catch (err) { next(err); }
});

// GET /api/life/schedule
app.get('/api/life/schedule', async (_req, res, next) => {
  try {
    const data = await readJsonFile('schedule.json');
    res.json(data || []);
  } catch (err) { next(err); }
});

// GET /api/life/reminders
app.get('/api/life/reminders', async (_req, res, next) => {
  try {
    const data = await readJsonFile('reminders.json');
    res.json(data || []);
  } catch (err) { next(err); }
});

// GET /api/life/energy
app.get('/api/life/energy', async (_req, res, next) => {
  try {
    const data = await readJsonFile('energy-log.json');
    res.json(data || []);
  } catch (err) { next(err); }
});

// GET /api/life/brain-dumps
app.get('/api/life/brain-dumps', async (_req, res, next) => {
  try {
    const data = await readJsonFile('brain-dumps.json');
    res.json(data || []);
  } catch (err) { next(err); }
});

// GET /api/life/focus
app.get('/api/life/focus', async (_req, res, next) => {
  try {
    const data = await readJsonFile('focus-sessions.json');
    res.json(data || { current: null, sessions: [], daily_deep_work_min: {} });
  } catch (err) { next(err); }
});

// POST /api/life/brain-dump — add a new brain dump
app.post('/api/life/brain-dump', async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text required' });

    const dumps = (await readJsonFile('brain-dumps.json')) || [];
    const now = new Date();
    const entry = {
      id: Math.random().toString(36).slice(2, 10),
      text: text.trim(),
      timestamp: now.toISOString(),
      day: now.toISOString().slice(0, 10),
      processed: false,
      extractions: [],
    };
    dumps.push(entry);
    await writeJsonFile('brain-dumps.json', dumps);
    broadcast({ type: 'life', action: 'brain-dump', data: entry });
    res.status(201).json(entry);
  } catch (err) { next(err); }
});

// POST /api/life/focus/start — start a focus session
app.post('/api/life/focus/start', async (req, res, next) => {
  try {
    const { task, duration } = req.body;
    const durationMin = parseInt(duration || '25', 10);
    const now = new Date();
    const data = (await readJsonFile('focus-sessions.json')) || { current: null, sessions: [], daily_deep_work_min: {} };

    if (data.current) return res.status(409).json({ error: 'Focus session already active' });

    data.current = {
      task: task || 'Deep work',
      duration_min: durationMin,
      started_at: now.toISOString(),
      ends_at: new Date(now.getTime() + durationMin * 60000).toISOString(),
    };

    await writeJsonFile('focus-sessions.json', data);
    broadcast({ type: 'life', action: 'focus-start', data: data.current });
    res.status(201).json(data.current);
  } catch (err) { next(err); }
});

// POST /api/life/focus/stop — end current focus session
app.post('/api/life/focus/stop', async (req, res, next) => {
  try {
    const data = (await readJsonFile('focus-sessions.json')) || { current: null, sessions: [], daily_deep_work_min: {} };
    if (!data.current) return res.status(404).json({ error: 'No active focus session' });

    const now = new Date();
    const started = new Date(data.current.started_at);
    const actualMin = Math.round((now - started) / 60000);
    const session = {
      ...data.current,
      ended_at: now.toISOString(),
      actual_min: actualMin,
      note: req.body.note || '',
    };
    data.sessions.push(session);

    const today = now.toISOString().slice(0, 10);
    data.daily_deep_work_min[today] = (data.daily_deep_work_min[today] || 0) + actualMin;
    data.current = null;

    await writeJsonFile('focus-sessions.json', data);
    broadcast({ type: 'life', action: 'focus-stop', data: session });
    res.json(session);
  } catch (err) { next(err); }
});

// POST /api/life/energy — log energy reading
app.post('/api/life/energy', async (req, res, next) => {
  try {
    const { energy, focus, mood, note } = req.body;
    if (energy == null || focus == null || mood == null) {
      return res.status(400).json({ error: 'energy, focus, mood required (1-5)' });
    }

    const readings = (await readJsonFile('energy-log.json')) || [];
    const now = new Date();
    const entry = {
      energy: Math.max(1, Math.min(5, parseInt(energy))),
      focus: Math.max(1, Math.min(5, parseInt(focus))),
      mood: Math.max(1, Math.min(5, parseInt(mood))),
      note: note || '',
      timestamp: now.toISOString(),
      hour: now.getUTCHours(),
      day: now.toISOString().slice(0, 10),
      day_of_week: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getUTCDay()],
    };
    readings.push(entry);
    await writeJsonFile('energy-log.json', readings);
    broadcast({ type: 'life', action: 'energy', data: entry });
    res.status(201).json(entry);
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// Timeline API — Unified chronological view merging all sources
// ---------------------------------------------------------------------------
app.get('/api/timeline', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
    const before = req.query.before || null; // ISO timestamp for pagination
    const events = [];

    // 1. Dispatch tasks — queue, active, done, failed
    const taskDirs = [
      { dir: QUEUE_DIR, status: 'queued' },
      { dir: ACTIVE_DIR, status: 'active' },
      { dir: DONE_DIR, status: 'done' },
      { dir: TASK_FAILED_DIR, status: 'failed' },
    ];
    for (const { dir, status } of taskDirs) {
      try {
        const files = await readdir(dir);
        for (const f of files) {
          if (!f.endsWith('.json') || f === 'index.json') continue;
          try {
            const task = JSON.parse(await readFile(join(dir, f), 'utf8'));
            const ts = task.created_at || task.created || task.timestamp;
            if (!ts) continue;
            events.push({
              id: `tl_task_created_${task.id || f}`,
              type: 'task_created',
              source: 'dispatch',
              agent: task.agent || task.assigned_to || 'system',
              title: `Task ${status}: ${task.title || task.name || f.replace('.json', '')}`,
              detail: task.description || task.prompt || '',
              timestamp: ts,
              status,
              priority: task.priority || 'P2',
              linked_entities: [{ type: 'task', id: task.id || f.replace('.json', '') }],
            });
            // If completed, add completion event too
            if (task.completed_at) {
              events.push({
                id: `tl_task_done_${task.id || f}`,
                type: 'task_completed',
                source: 'dispatch',
                agent: task.agent || task.assigned_to || 'system',
                title: `Task completed: ${task.title || task.name || f.replace('.json', '')}`,
                detail: task.result ? (typeof task.result === 'string' ? task.result.slice(0, 200) : JSON.stringify(task.result).slice(0, 200)) : '',
                timestamp: task.completed_at,
                status: 'done',
                linked_entities: [{ type: 'task', id: task.id || f.replace('.json', '') }],
              });
            }
            if (task.failed_at) {
              events.push({
                id: `tl_task_failed_${task.id || f}`,
                type: 'task_failed',
                source: 'dispatch',
                agent: task.agent || task.assigned_to || 'system',
                title: `Task failed: ${task.title || task.name || f.replace('.json', '')}`,
                detail: task.error || task.failure_reason || '',
                timestamp: task.failed_at,
                status: 'failed',
                linked_entities: [{ type: 'task', id: task.id || f.replace('.json', '') }],
              });
            }
          } catch { /* skip corrupt */ }
        }
      } catch { /* dir may not exist */ }
    }

    // 2. Proposals
    try {
      const propFiles = await readdir(PROPOSALS_DIR);
      for (const f of propFiles) {
        if (!f.endsWith('.json')) continue;
        try {
          const prop = JSON.parse(await readFile(join(PROPOSALS_DIR, f), 'utf8'));
          if (prop.created_at) {
            events.push({
              id: `tl_prop_created_${prop.id || f}`,
              type: 'proposal_created',
              source: 'proposal',
              agent: prop.source_agent || prop.agent || 'system',
              title: `Proposal: ${prop.title || 'Untitled'}`,
              detail: prop.description || '',
              timestamp: prop.created_at,
              status: prop.status || 'pending',
              confidence: prop.confidence,
              linked_entities: [{ type: 'proposal', id: prop.id || f.replace('.json', '') }],
            });
          }
          if (prop.resolved_at) {
            events.push({
              id: `tl_prop_resolved_${prop.id || f}`,
              type: 'proposal_resolved',
              source: 'proposal',
              agent: prop.resolved_by || prop.source_agent || 'system',
              title: `Proposal ${prop.status || 'resolved'}: ${prop.title || 'Untitled'}`,
              detail: prop.resolution_note || '',
              timestamp: prop.resolved_at,
              status: prop.status,
              linked_entities: [{ type: 'proposal', id: prop.id || f.replace('.json', '') }],
            });
          }
        } catch { /* skip */ }
      }
    } catch { /* proposals dir may not exist */ }

    // 3. Discord feed messages
    try {
      const AGENT_FEED_CHANNEL = process.env.DISCORD_AGENT_FEED_CHANNEL || '';
      let channelId = AGENT_FEED_CHANNEL;
      if (!channelId) {
        try {
          const raw = await readFile(CHANNEL_IDS_PATH, 'utf8');
          const channels = JSON.parse(raw);
          channelId = channels['agent-feed'] || channels['🤖-agent-feed'] || '';
        } catch {}
      }
      if (channelId) {
        const messages = await discordFetch(`/channels/${channelId}/messages?limit=30`);
        if (Array.isArray(messages)) {
          messages.forEach(msg => {
            events.push({
              id: `tl_discord_${msg.id}`,
              type: 'discord_message',
              source: 'discord',
              agent: msg.author?.global_name || msg.author?.username || 'unknown',
              title: (msg.content || '').slice(0, 120) || '[embed/attachment]',
              detail: msg.content || '',
              timestamp: msg.timestamp,
              linked_entities: [{ type: 'discord', id: msg.id }],
            });
          });
        }
      }
    } catch { /* Discord may be down */ }

    // 4. Feed events (vault writes, system alerts, etc.)
    try {
      const feedEntries = await readFeedLines();
      feedEntries.forEach(e => {
        const ts = e.timestamp || e.time;
        if (!ts) return;
        let source = 'system';
        let type = 'system_event';
        if (e.type === 'vault_write') { source = 'vault'; type = 'vault_write'; }
        else if (e.type === 'task_complete' || e.type === 'task_completed') { source = 'dispatch'; type = 'task_completed'; }
        else if (e.type === 'system_alert') { source = 'system'; type = 'system_alert'; }
        else if (e.type === 'queue_item_created') { source = 'proposal'; type = 'proposal_created'; }

        events.push({
          id: `tl_feed_${e.id || Math.random().toString(36).slice(2)}`,
          type,
          source,
          agent: e.agent || 'system',
          title: e.summary || e.type || 'Event',
          detail: e.detail || '',
          timestamp: ts,
          linked_entities: [],
        });
      });
    } catch { /* feed file may not exist */ }

    // 5. System overview snapshot (single event for current state)
    try {
      const sysTs = new Date().toISOString();
      events.push({
        id: `tl_sys_heartbeat_${Date.now()}`,
        type: 'system_heartbeat',
        source: 'system',
        agent: 'system',
        title: 'System heartbeat',
        detail: 'System is running',
        timestamp: sysTs,
        linked_entities: [],
      });
    } catch {}

    // Sort by timestamp descending
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    let filtered = events;
    if (before) {
      const beforeDate = new Date(before);
      filtered = events.filter(e => new Date(e.timestamp) < beforeDate);
    }

    res.json(filtered.slice(0, limit));
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// Agent Workbench API
// ---------------------------------------------------------------------------
const OPENCLAW_AGENTS_PATH = join(process.env.HOME, '.openclaw', 'agents');
const WORKBENCH_LOG_PATH = join(process.env.HOME, '.openclaw', 'agent-workbench-log.jsonl');

// List all agents in the OpenClaw agents directory
app.get('/api/agent-workbench/agents', async (req, res, next) => {
  try {
    const { readdir: readdirAsync, stat: statAsync, readFile: readFileAsync } = await import('fs/promises');
    const { existsSync } = await import('fs');
    const dirs = await readdirAsync(OPENCLAW_AGENTS_PATH);
    const agents = [];
    for (const dir of dirs) {
      const agentPath = join(OPENCLAW_AGENTS_PATH, dir);
      const s = await statAsync(agentPath).catch(() => null);
      if (!s || !s.isDirectory()) continue;
      const soulPath = join(agentPath, 'workspace', 'SOUL.md');
      const agentsMdPath = join(agentPath, 'workspace', 'AGENTS.md');
      let soulSize = 0;
      try {
        const ss = await statAsync(soulPath);
        soulSize = ss.size;
      } catch {}
      agents.push({
        id: dir,
        has_soul: existsSync(soulPath),
        has_agents_md: existsSync(agentsMdPath),
        soul_size: soulSize,
        workspace_path: agentPath,
      });
    }
    res.json(agents);
  } catch (err) { next(err); }
});

// Get agent detail + SOUL.md content
app.get('/api/agent-workbench/agents/:id', async (req, res, next) => {
  try {
    const { stat: statAsync, readFile: readFileAsync } = await import('fs/promises');
    const { existsSync } = await import('fs');
    const id = req.params.id;
    const agentPath = join(OPENCLAW_AGENTS_PATH, id);
    const s = await statAsync(agentPath).catch(() => null);
    if (!s || !s.isDirectory()) return res.status(404).json({ error: 'Agent not found' });

    const soulPath = join(agentPath, 'workspace', 'SOUL.md');
    const agentsMdPath = join(agentPath, 'workspace', 'AGENTS.md');
    const candidatePath = join(agentPath, 'workspace', '.soul-candidate.md');
    let soulContent = null;
    let soulSize = 0;
    let candidateContent = null;
    try {
      soulContent = await readFileAsync(soulPath, 'utf8');
      soulSize = Buffer.byteLength(soulContent, 'utf8');
    } catch {}
    try {
      candidateContent = await readFileAsync(candidatePath, 'utf8');
    } catch {}
    res.json({
      id,
      has_soul: existsSync(soulPath),
      has_agents_md: existsSync(agentsMdPath),
      soul_size: soulSize,
      soul_content: soulContent,
      candidate_content: candidateContent,
      workspace_path: agentPath,
    });
  } catch (err) { next(err); }
});

// Update SOUL.md (or candidate)
app.put('/api/agent-workbench/agents/:id/soul', async (req, res, next) => {
  try {
    const { writeFile: writeFileAsync, mkdir: mkdirAsync } = await import('fs/promises');
    const id = req.params.id;
    const { content, variant } = req.body;
    if (typeof content !== 'string') return res.status(400).json({ error: 'content required' });
    const agentPath = join(OPENCLAW_AGENTS_PATH, id);
    const workspacePath = join(agentPath, 'workspace');
    await mkdirAsync(workspacePath, { recursive: true });
    const isCandidate = variant === 'candidate';
    const targetPath = isCandidate
      ? join(workspacePath, '.soul-candidate.md')
      : join(workspacePath, 'SOUL.md');
    await writeFileAsync(targetPath, content, 'utf8');
    res.json({ ok: true, path: targetPath, variant: isCandidate ? 'candidate' : 'current' });
  } catch (err) { next(err); }
});

// Run a test prompt against an agent
app.post('/api/agent-workbench/agents/:id/test', async (req, res, next) => {
  try {
    const { writeFile: writeFileAsync, readFile: readFileAsync, appendFile: appendFileAsync } = await import('fs/promises');
    const { existsSync } = await import('fs');
    const id = req.params.id;
    const { prompt, variant } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });

    const agentPath = join(OPENCLAW_AGENTS_PATH, id);
    const soulPath = variant === 'candidate'
      ? join(agentPath, 'workspace', '.soul-candidate.md')
      : join(agentPath, 'workspace', 'SOUL.md');

    let soulContent = '';
    try { soulContent = await readFileAsync(soulPath, 'utf8'); } catch {}

    const systemPrompt = soulContent
      ? `${soulContent}\n\n---\nYou are being tested. Respond to the following prompt concisely (max 300 words).`
      : 'You are an AI assistant. Respond concisely (max 300 words).';

    // Write system prompt to a temp file
    const tmpSystem = join('/tmp', `workbench-system-${Date.now()}.txt`);
    const tmpUser = join('/tmp', `workbench-user-${Date.now()}.txt`);
    await writeFileAsync(tmpSystem, systemPrompt, 'utf8');
    await writeFileAsync(tmpUser, prompt, 'utf8');

    // Run claude with the system prompt and user prompt
    const claudePath = '/usr/bin/claude';
    const fullPrompt = `System: ${systemPrompt}\n\nUser: ${prompt}`;

    let response;
    try {
      response = await new Promise((resolve, reject) => {
        execFile(claudePath, ['--print', '--permission-mode', 'bypassPermissions', fullPrompt], {
          timeout: 30000,
          maxBuffer: 2 * 1024 * 1024,
          env: { ...process.env },
        }, (err, stdout, stderr) => {
          if (err) return reject(err);
          resolve(stdout.trim());
        });
      });
    } catch (e) {
      // Fallback: use echo-based mock for demo
      response = `[Test runner: claude not available — ${e.message}]\n\nAgent: ${id}\nVariant: ${variant || 'current'}\nPrompt: ${prompt}`;
    }

    // Log result
    const logEntry = {
      ts: new Date().toISOString(),
      agent_id: id,
      variant: variant || 'current',
      prompt,
      response,
    };
    try {
      await appendFileAsync(WORKBENCH_LOG_PATH, JSON.stringify(logEntry) + '\n', 'utf8');
    } catch {}

    res.json({ ok: true, agent_id: id, variant: variant || 'current', prompt, response });
  } catch (err) { next(err); }
});

// Get workbench test log for an agent
app.get('/api/agent-workbench/agents/:id/logs', async (req, res, next) => {
  try {
    const { readFile: readFileAsync } = await import('fs/promises');
    const { existsSync } = await import('fs');
    const id = req.params.id;
    if (!existsSync(WORKBENCH_LOG_PATH)) return res.json([]);
    const raw = await readFileAsync(WORKBENCH_LOG_PATH, 'utf8');
    const lines = raw.trim().split('\n').filter(Boolean);
    const entries = lines
      .map(l => { try { return JSON.parse(l); } catch { return null; } })
      .filter(e => e && e.agent_id === id)
      .reverse()
      .slice(0, 50);
    res.json(entries);
  } catch (err) { next(err); }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
server.listen(PORT, () => {
  console.log(`Agent OS Bridge listening on :${PORT}`);
  console.log(`  Gateway: ${GATEWAY_URL}`);
  console.log(`  Auth: ${AUTH_TOKEN ? 'enabled' : 'disabled (no token set)'}`);
  startPolling();
  watchQueueDir();
});
