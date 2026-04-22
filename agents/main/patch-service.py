from pathlib import Path
p = Path('/home/trajan/Projects/ema/services/core/runtime-fabric/service.ts')
text = p.read_text()
text = text.replace('export { listObservedSessions };\nexport type { ObservedSessionSnapshot, ObservedSessionSnapshotList };', 'export { listObservedSessionEvents, listObservedSessions };\nexport type { ObservedSessionEvent, ObservedSessionSnapshot, ObservedSessionSnapshotList };')
text = text.replace('import { listObservedSessions } from "./session-observer.js";\nimport type { ObservedSessionSnapshot, ObservedSessionSnapshotList } from "./session-observer.js";', 'import { listObservedSessionEvents, listObservedSessions } from "./session-observer.js";\nimport type { ObservedSessionEvent, ObservedSessionSnapshot, ObservedSessionSnapshotList } from "./session-observer.js";')
p.write_text(text)
