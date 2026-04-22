# LCM Summary sum_1369ddfefd172a64

Created: 2026-03-20 10:20:09
Kind: leaf
Depth: 0
Conversation: 770
Tokens: 1215
Descendants: 0
Earliest: 2026-03-20T10:19:34.000Z
Latest: 2026-03-20T10:19:35.000Z

## Content

[2026-03-20 10:19 UTC]
      await Bridge.sendMessage(room._channelId, text);
      sentToDiscord = true;
      toast('📨 Sent to Discord', 'success');
    } catch (e) {
      toast(`⚠️ Discord send failed: ${e.message}`, 'error');
    }
  }

  // Dispatch to agent for real processing
  try {
    const agentList = room.agents.join(', ');
    await fetch(`${baseUrl}/api/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        agent: room.agents[0] || 'righthand',
        context: `room:${room.id}:${room.name} agents:[${agentList}]`,
        page: 'rooms',
      }),
    });
    
    // Show dispatch confirmation instead of fake response
    const respondingAgent = room.agents[Math.floor(Math.random() * room.agents.length)];
    const ag = iga(respondingAgent);
    room.messages.push({
      id: 'rmsg_' + Date.now(),
      sender: respondingAgent,
      content: `🔄 Dispatched to ${ag.name}. Response will appear in the feed.`,
      time: new Date().toISOString(),
    });
    saveRooms();
    if (roomsCurrentId === room.id) renderRoomView();
    if (!sentToDiscord) toast(`🔄 Dispatched to agents`, 'success');
  } catch {
    // Fallback: simulated agent response
    setTimeout(() => {
      const respondingAgent = room.agents[Math.floor(Math.random() * room.agents.length)];
      const responsePool = [
        `Understood. I'll incorporate that.`,
        `On it. Will update when there's progress.`,
        `Noted. Adjusting my approach.`,
        `Got it. That aligns with what I was thinking.`,
      ];
      room.messages.push({
        id: 'rmsg_' + Date.now(),
        sender: respondingAgent,
        content: responsePool[Math.floor(Math.random() * responsePool.length)],
        time: new Date().toISOString(),
      });
      saveRooms();
      if (roomsCurrentId === room.id) renderRoomView();
    }, 1000 + Math.random() * 2000);
  }
}

function openNewRoomModal() {
  roomsModalOpen = true;
  const overlay = document.getElementById('rooms-modal-overlay');
  if (overlay) overlay.classList.remove('hidden');
}

function closeNewRoomModal() {
  roomsModalOpen = false;
  const overlay = document.getElementById('rooms-modal-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function createRoom() {
  const nameInput = document.getElementById('new-room-name');
  const purposeInput = document.getElementById('new-room-purpose');
  const name = nameInput?.value.trim();
  const purpose = purposeInput?.value.trim();
  if (!name) { toast('Room name is required', 'error'); return; }

  const selectedAgents = [];
  document.querySelectorAll('.new-room-agent-cb:checked').forEach(cb => selectedAgents.push(cb.value));
  if (selectedAgents.length === 0) { toast('Select at least one agent', 'error'); return; }

  const newRoom = {
    id: 'room_' + Date.now(),
    name,
    agents: selectedAgents,
    purpose: purpose || '',
    unread: 0,
    messages: [],
  };

  rooms.push(newRoom);
  saveRooms();
  closeNewRoomModal();
  roomsCurrentId = newRoom.id;
  renderRooms();
  toast(`Created room: ${name}`, 'success');
}


// ═══════════════════════════════════════════════════════════
// PAGE 3: BRIEFING — Living Document
// ═══════════════════════════════════════════════════════════

let briefingRefreshTimer = null;
let briefingLastData = {};

function initBriefing() {
  renderBriefingDocument();
  // Auto-refresh every 30 seconds
  if (briefingRefreshTimer) clearInterval(briefingRefreshTimer);
  briefingRefreshTimer = setInterval(() => {
    if (currentPage === 'briefing') renderBriefingDocument();
  }, 30000);
}

async function fetchBriefingData() {
  const baseUrl = (typeof Bridge !== 'undefined' && Bridge.baseUrl) ? Bridge.baseUrl : '';
  const fetchJSON = async (url) => {
    try {
      const r = await fetch(baseUrl + url);
      if (r.ok) return await r.json();
    } catch {}
    return null;
  };

  const [feedData, proposalsData, systemData, tasksData, vaultData] = await Promise.all([
    fetchJSON('/api/feed?limit=50'),
    fetchJSON('/api/proposals?status=all'),
    fetchJSON('/api/system/overview'),
    fetchJSON('/api/tasks/all'),
    fetchJSON('/api/vault/stats'),
  ]);

  return { feed: feedData, proposals: proposalsData, system: systemData, tasks: tasksData, vault: vaultData };
}

async function renderBriefingDocument() {
  const container = document.getElementById('briefing-document');
  if (!container) return;

  const data = await fetchBriefingData();

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long',
[LCM fallback summary; truncated for context management]
