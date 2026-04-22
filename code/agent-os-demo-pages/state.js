/* Agent OS v8 — state.js — Centralized Reactive State Store */
'use strict';

const AppState = {
  // ── Connection ─────────────────────────────────────────
  bridge: {
    connected: false,
    liveMode: false,
    url: '',
    lastEvent: null,
    seq: 0,           // Last received event sequence number
    missedSeqs: [],    // Gaps detected
  },

  // ── Feed / Stream ──────────────────────────────────────
  feed: {
    events: [],        // feedEvents equivalent
    filter: 'all',
    loading: false,
    lastRefresh: null,
  },

  // ── Queue / Proposals ──────────────────────────────────
  queue: {
    cards: [],         // queueCards equivalent
    filter: 'pending',
    loading: false,
  },

  // ── Talk / Channels ────────────────────────────────────
  talk: {
    channels: { categories: [], flat: [] },
    channelIdMap: {},
    currentChannel: null,
    messages: [],
    typing: [],
    loading: false,
  },

  // ── Sessions ───────────────────────────────────────────
  sessions: {
    list: [],
    loading: false,
    sort: { key: 'updated', dir: 'desc' },
    filter: '',
    page: 0,
    pageSize: 25,
  },

  // ── Usage ──────────────────────────────────────────────
  usage: {
    summary: null,
    sessions: [],
    range: 'week',
    loading: false,
  },

  // ── Config ─────────────────────────────────────────────
  config: {
    data: null,
    schema: null,
    dirty: {},
    mode: 'form',     // 'form' | 'raw'
    loading: false,
    saving: false,
    errors: [],
  },

  // ── System / Pulse ─────────────────────────────────────
  system: {
    overview: null,
    agents: [],
    services: [],
    crons: [],
    logs: [],
    logFilter: { levels: ['info', 'warn', 'error'], search: '' },
    logAutoFollow: true,
    loading: false,
  },

  // ── Navigation ─────────────────────────────────────────
  nav: {
    currentPage: 'feed',
    previousPage: null,
  },

  // ── Skills ─────────────────────────────────────────────
  skills: {
    list: [],
    loading: false,
  },

  // ── Models ─────────────────────────────────────────────
  models: {
    list: [],
    loading: false,
  },
};

// ═══════════════════════════════════════════════════════════
// Reactive subscription system
// ═══════════════════════════════════════════════════════════

const _subscribers = new Map();   // path -> Set<callback>
let _batchDepth = 0;
const _batchedPaths = new Set();

/**
 * Subscribe to state changes at a given path.
 * Path can be dot-separated: 'feed.events', 'bridge.connected'
 * Wildcard '*' subscribes to all changes.
 * Returns unsubscribe function.
 */
function subscribe(path, callback) {
  if (!_subscribers.has(path)) _subscribers.set(path, new Set());
  _subscribers.get(path).add(callback);
  return () => _subscribers.get(path)?.delete(callback);
}

/**
 * Set state at a dot-separated path with change notification.
 * e.g. setState('feed.events', [...]) or setState('bridge.connected', true)
 */
function setState(path, value) {
  const parts = path.split('.');
  let obj = AppState;
  for (let i = 0; i < parts.length - 1; i++) {
    if (obj[parts[i]] === undefined) obj[parts[i]] = {};
    obj = obj[parts[i]];
  }
  const key = parts[parts.length - 1];
  const old = obj[key];
  if (old === value) return; // No change
  obj[key] = value;

  if (_batchDepth > 0) {
    _batchedPaths.add(path);
    // Also add parent paths
    for (let i = 1; i < parts.length; i++) {
      _batchedPaths.add(parts.slice(0, i).join('.'));
    }
    _batchedPaths.add('*');
  } else {
    _notify(path, value, old);
  }
}

/**
 * Get state at a dot-separated path.
 */
function getState(path) {
  const parts = path.split('.');
  let obj = AppState;
  for (const p of parts) {
    if (obj === undefined || obj === null) return undefined;
    obj = obj[p];
  }
  return obj;
}

/**
 * Batch multiple setState calls to fire notifications only once.
 */
function batchState(fn) {
  _batchDepth++;
  try {
    fn();
  } finally {
    _batchDepth--;
    if (_batchDepth === 0 && _batchedPaths.size > 0) {
      const paths = [..._batchedPaths];
      _batchedPaths.clear();
      for (const p of paths) {
        const subs = _subscribers.get(p);
        if (subs) {
          const val = p === '*' ? AppState : getState(p);
          for (const cb of subs) {
            try { cb(val, p); } catch (e) { console.error('[State] Subscriber error:', e); }
          }
        }
      }
    }
  }
}

function _notify(path, value, old) {
  // Notify exact path subscribers
  const subs = _subscribers.get(path);
  if (subs) for (const cb of subs) { try { cb(value, old); } catch (e) { console.error('[State] Subscriber error:', e); } }

  // Notify parent path subscribers (e.g., 'feed' when 'feed.events' changes)
  const parts = path.split('.');
  for (let i = 1; i < parts.length; i++) {
    const parent = parts.slice(0, i).join('.');
    const parentSubs = _subscribers.get(parent);
    if (parentSubs) {
      const parentVal = getState(parent);
      for (const cb of parentSubs) { try { cb(parentVal, parent); } catch (e) { console.error('[State] Subscriber error:', e); } }
    }
  }

  // Notify wildcard subscribers
  const wild = _subscribers.get('*');
  if (wild) for (const cb of wild) { try { cb(AppState, path); } catch (e) { console.error('[State] Subscriber error:', e); } }
}

// ═══════════════════════════════════════════════════════════
// Debug helper
// ═══════════════════════════════════════════════════════════

function dumpState() {
  console.log('[State] Current AppState:', JSON.parse(JSON.stringify(AppState)));
  console.log('[State] Subscribers:', [..._subscribers.keys()].map(k => `${k}: ${_subscribers.get(k).size}`));
}

// Make available globally
if (typeof window !== 'undefined') {
  window.AppState = AppState;
  window.subscribe = subscribe;
  window.setState = setState;
  window.getState = getState;
  window.batchState = batchState;
  window.dumpState = dumpState;
}
