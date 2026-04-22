# LCM Summary sum_a9bffbe7889505c1

Created: 2026-03-20 10:54:12
Kind: leaf
Depth: 0
Conversation: 791
Tokens: 630
Descendants: 0
Earliest: 2026-03-20T10:54:02.000Z
Latest: 2026-03-20T10:54:02.000Z

## Content

[2026-03-20 10:54 UTC]
System page has a significant issue — Memory, Disk, and Uptime all show "NaN%", "NaN / 200 GB", "NaNm". CPU works fine though. Let me find the rendering code:

[2026-03-20 10:54 UTC]
65:  let cpu = 34, mem = 67, disk = 72, uptime = 345600; // 4 days
77:      if (data.uptime !== undefined) uptime = data.uptime;
81:      _updateDashCards(cpu, mem, disk, uptime, cpuAvg);
86:      _updateDashCards(cpu, mem, disk, uptime, cpuAvg);
92:    _updateDashCards(cpu, mem, disk, uptime, cpuAvg);
96:function _updateDashCards(cpu, mem, disk, uptime, cpuAvg) {
132:      <div class="sys-card-value">${disk}%</div>
141:      <div class="sys-card-value">${_fmtUptime(uptime)}</div>
155:    { id: 'openclaw-gateway',  name: 'OpenClaw Gateway',  status: 'running', uptime: 345600, lastRestart: '2026-03-16 08:30' },
156:    { id: 'oauth-guardian',    name: 'OAuth Guardian',    status: 'running', uptime: 259200, lastRestart: '2026-03-17 10:15' },
157:    { id: 'agent-os-bridge',   name: 'Agent OS Bridge',  status: 'running', uptime: 172800, lastRestart: '2026-03-18 12:00' },
158:    { id: 'bridge-sync',       name: 'Bridge Sync',      status: 'running', uptime: 345600, lastRestart: '2026-03-16 08:30' },
159:    { id: 'qmd-cron',          name: 'QMD Cron',         status: 'running', uptime: 86400,  lastRestart: '2026-03-19 06:00' },
160:    { id: 'ontology-sync',     name: 'Ontology Sync',    status: 'stopped', uptime: 0,      lastRestart: '2026-03-19 03:00' },
189:          <span class="sys-svc-uptime">${isUp ? _fmtUptime(s.uptime) : 'stopped'}</span>
911:        { id: 'task-bridge-health', title: 'Bridge health dashboard', description: 'Expose /api/health with uptime.', column: 'active', agent: 'ops', priority: 'P2', labels: ['bridge','monitoring'] },

[2026-03-20 10:54 UTC]


[2026-03-20 10:54 UTC]
function _renderDashboardHeader() {
  const el = $('sys-dashboard-header');
  if (!el) return;

  // Simulate system metrics (would come from /api/overview in live mode)
  let cpu = 34, mem = 67, disk = 72, uptime = 345600; // 4 days
  let cpuAvg = { m1: 0.82, m5: 1.14, m15: 0.97 };

  // Try to get live data from Bridge
  if (typeof Bridge !== 'undefined' && Bridge.liveMode) {
    Bridge.getSystemOverview().then(data => {
      if (data.cpu !== undefined) {
        cpu = Math.round(data.cpu);
        cpuAvg = data.loadavg || cpuAvg;
      }
      if (data.memory !== undefined) mem = Math.round(data.memory);
      if (data.di
[LCM fallback summary; truncated for context management]
