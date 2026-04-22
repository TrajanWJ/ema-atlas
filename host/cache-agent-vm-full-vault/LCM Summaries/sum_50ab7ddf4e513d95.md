# LCM Summary sum_50ab7ddf4e513d95

Created: 2026-03-20 10:54:09
Kind: leaf
Depth: 0
Conversation: 791
Tokens: 543
Descendants: 0
Earliest: 2026-03-20T10:46:54.000Z
Latest: 2026-03-20T10:54:02.000Z

## Content

[2026-03-20 10:46 UTC]
Pipelines now renders with real data. But I notice many tasks show "Untitled" — the title is missing. This is because the tasks have a `task` field but no `title` field. The pipeline code uses `t.title || t.task || 'Untitled'` when creating card data, so it should be picking up `task`. Let me check:

[2026-03-20 10:46 UTC]
{
  "ok": true,
  "targetId": "2C33847AAFC7A3578F1334F01B113D38",
  "url": "http://192.168.122.10:18790/app/",
  "result": "[{\"id\":\"proactive-03f82d5cdf-70496\"},{\"id\":\"research-design-refs-20260321\",\"title\":\"Find Agent OS design reference websites\"},{\"id\":\"proactive-127403f8aa-59066\"}]"
}

[2026-03-20 10:46 UTC]
Some tasks have neither `title` nor `task` field — just an `id`. Let me check what fields they do have:

[2026-03-20 10:46 UTC]
{
  "ok": true,
  "targetId": "2C33847AAFC7A3578F1334F01B113D38",
  "url": "http://192.168.122.10:18790/app/",
  "result": "[\"id\",\"description\",\"agent\",\"priority\",\"status\",\"created\",\"timeout_minutes\",\"context\",\"source\",\"tags\"]"
}

[2026-03-20 10:46 UTC]
So these tasks have a `description` field but no `title`. Let me check what description looks like:

[2026-03-20 10:46 UTC]
{
  "ok": true,
  "targetId": "2C33847AAFC7A3578F1334F01B113D38",
  "url": "http://192.168.122.10:18790/app/",
  "result": "Add wikilinks to orphan vault file: Operations/stackmemory-autoresearch-install-2026-03-19.md — find related notes and add at least 2 wikilinks"
}

[2026-03-20 10:46 UTC]
These tasks use `description` as their main text. The pipeline card code already maps `t.title || t.task || 'Untitled'` but doesn't include `t.description`. Let me fix this in the pipeline data mapping:

[2026-03-20 10:46 UTC]
  if (liveQueue || liveActive || liveDone) {
    (liveQueue || []).forEach(t => {
      stageCards.inbox.push({
        id: t.id, title: t.title || t.task || 'Untitled', agent: t.agent || '',
        priority: t.priority || 'P3', tags: [], _raw: t,
        _timeInStage: timeAgoShort(t.created_at || t.created),
      });
    });
    (liveActive || []).forEach(t => {
      stageCards.i
[LCM fallback summary; truncated for context management]
