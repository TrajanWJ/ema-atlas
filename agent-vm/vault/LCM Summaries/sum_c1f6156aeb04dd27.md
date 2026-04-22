# LCM Summary sum_c1f6156aeb04dd27

Created: 2026-03-19 07:59:23
Kind: leaf
Depth: 0
Conversation: 512
Tokens: 1215
Descendants: 0
Earliest: 2026-03-19T07:42:31.000Z
Latest: 2026-03-19T07:42:32.000Z

## Content

[2026-03-19 07:42 UTC]
  fab.classList.toggle('open', quickActionsOpen);
  if (quickActionsOpen) {
    menu.classList.remove('hidden');
    updateQuickActions();
  } else {
    menu.classList.add('hidden');
  }
}

function updateQuickActions() {
  const menu = $('quick-actions-menu');
  if (!menu || !quickActionsOpen) return;
  const page = currentPage || 'feed';
  const actions = QUICK_ACTIONS[page] || QUICK_ACTIONS.feed;
  menu.innerHTML = actions.map(a =>
    `<button class="qa-btn" onclick="runQuickAction('${a.action}')">
      <span class="qa-btn-icon">${a.icon}</span>
      <span class="qa-btn-label">${a.label}</span>
    </button>`
  ).join('');
}

function runQuickAction(action) {
  toggleQuickActions(); // close menu

  // Simulate the action with streaming progress
  const actionNames = {
    'research': '🔬 Researching topic...',
    'gaps': '📊 Analyzing gaps across vault...',
    'proposals': '🎯 Generating 6 proposals...',
    'summarize': '📝 Summarizing today\'s activity...',
    'deploy': '📨 Deploying update to agents...',
    'broadcast': '📢 Broadcasting to all channels...',
    'summon': '🤖 Summoning agent...',
    'auto-prioritize': '⚡ Auto-prioritizing queue...',
    'batch-approve': '✅ Batch approving items...',
    'clear-done': '🗑️ Clearing answered items...',
    'find-gaps': '🧠 Scanning vault for gaps...',
    'auto-link': '🔗 Auto-linking related notes...',
    'coverage': '📊 Generating coverage report...',
    'refresh-metrics': '🔄 Refreshing all metrics...',
    'health-check': '🚨 Running health check...',
    'cost-analysis': '📉 Analyzing token costs...',
  };

  const name = actionNames[action] || 'Running action...';
  toast(name, 'info', 2000);
  
  // Sync to Discord
  syncToDiscord('agent-feed', `⚡ Quick Action: ${name}`, 'righthand');
  addXP(20, 'quick action');

  // Simulate result after delay
  setTimeout(() => {
    const results = {
      'proposals': '✅ 6 proposals generated and posted to #dispatch',
      'gaps': '✅ Gap analysis complete — 3 areas identified',
      'research': '✅ Research task dispatched to 🔬 Researcher',
      'summarize': '✅ Daily summary posted to #daily-brief',
      'auto-prioritize': '✅ Queue reordered by urgency × impact',
      'batch-approve': '✅ 3 items approved, synced to Discord',
      'find-gaps': '✅ Found 4 uncovered topics in vault',
      'coverage': '✅ Coverage: 73% — weak in Operations, strong in Architecture',
    };
    toast(results[action] || '✅ Action complete', 'success', 3500);
    addNotification('Quick Action', results[action] || 'Complete', '⚡');
  }, 2000 + Math.random() * 1500);
}

// ═══════════════════════════════════════════════════════════
// MOBILE MENU
// ═══════════════════════════════════════════════════════════

let mobileMenuOpen = false;

function toggleMobileMenu() {
  mobileMenuOpen = !mobileMenuOpen;
  const drawer = $('mobile-menu-drawer');
  if (mobileMenuOpen) {
    drawer.classList.remove('hidden');
    // Re-render Lucide icons in the drawer
    if (typeof lucide !== 'undefined') lucide.createIcons({ nameAttr: 'data-lucide' });
  } else {
    drawer.classList.add('hidden');
  }
}

// ═══════════════════════════════════════════════════════════
// SCHEDULE VIEW
// ═══════════════════════════════════════════════════════════

const SCHEDULE_DATA = [
  { time: '06:00', events: [] },
  { time: '06:30', events: [{ label: 'QMD vault index', agent: 'ops', color: 'var(--orange)' }] },
  { time: '07:00', events: [{ label: '📢 Daily Brief generation', agent: 'righthand', color: 'var(--accent)' }] },
  { time: '07:15', events: [{ label: 'Heartbeat check', agent: 'ops', color: 'var(--orange)' }] },
  { time: '07:30', events: [] },
  { time: '08:00', events: [{ label: 'Dispatch queue scan', agent: 'righthand', color: 'var(--accent)' }, { label: 'Ingestor feed pull', agent: 'researcher', color: 'var(--accent2)' }] },
  { time: '08:30', events: [{ label: 'Session health check', agent: 'ops', color: 'var(--orange)' }] },
  { time: '09:00', events: [{ label: 'Morning batch dispatch', agent: 'righthand', color: 'var(--accent)', now: true }] },
  { time: '09:30', events: [{ label: 'Vault freshness scan', agent: 'ops', color: 'var(--orange)' }] },
  { time: '10:00', events: [{ label: 'Ontology sync', agent: 'ops', color: 'var(--orange)' }] },
  { time: '10:30', events: [] },
  { time: '11:00', events: [{ label: 'Competitive scan', agent: 'researcher', color: 'var(--accent2)' }] },
  { time: '12:00', events: [{ label: 'Memory pressure check', agent: 'righthand', color: 'var(--accent)' }] },
  { time: '13:00', events: [{ label: 'Agent fitness review', agent: 'righthand', color: 'var(--accent)' }] },
  { time: '14:00', events: [{ label: 'Red team sweep', agent: 'devil', color: 'var(--red)' }] },
  { time: '15:00', e
[LCM fallback summary; truncated for context management]
