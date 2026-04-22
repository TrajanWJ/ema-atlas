import { Router } from 'express';
import { Server as SocketServer } from 'socket.io';

export function applyRoutes(io: SocketServer): Router {
  const router = Router();

  router.post('/', async (req, res) => {
    const { projectId, instruction, surgicalEdits, fileWrites } = req.body;

    try {
      const session = (global as any).__supermanSession;
      if (!session) {
        return res.status(404).json({ error: 'No active session. Analyze a project first.' });
      }

      io.emit('engine-output', { type: 'info', text: `[→] Applying changes...`, timestamp: Date.now() });

      const { ModificationEngine } = await import('../../../src/modification/engine.js');
      const engine = new ModificationEngine(session.graph);

      if (surgicalEdits && surgicalEdits.length > 0) {
        io.emit('engine-output', { type: 'info', text: `[INFO] Applying ${surgicalEdits.length} surgical edits`, timestamp: Date.now() });

        const changes = await engine.applySurgicalEdits(surgicalEdits);
        io.emit('engine-output', { type: 'info', text: `[SUCCESS] Applied ${changes.length} changes`, timestamp: Date.now() });

        res.json({ success: true, changes: changes.length, diffs: changes.map(c => c.diff) });
      } else if (fileWrites && fileWrites.length > 0) {
        io.emit('engine-output', { type: 'info', text: `[INFO] Writing ${fileWrites.length} files`, timestamp: Date.now() });

        const changes = await engine.applyFileWrites(fileWrites);
        io.emit('engine-output', { type: 'info', text: `[SUCCESS] Wrote ${changes.length} files`, timestamp: Date.now() });

        res.json({ success: true, changes: changes.length, diffs: changes.map(c => c.diff) });
      } else if (instruction) {
        io.emit('engine-output', { type: 'info', text: `[INFO] Generating changes for: ${instruction}`, timestamp: Date.now() });

        const result = await engine.proposeChanges(instruction, session.graph);
        io.emit('engine-output', { type: 'info', text: `[SUCCESS] Generated ${result.length} changes`, timestamp: Date.now() });

        res.json({ success: true, changes: result.length, diffs: result.map(c => c.diff) });
      } else {
        res.status(400).json({ error: 'Provide instruction, surgicalEdits, or fileWrites' });
      }
    } catch (err: any) {
      io.emit('engine-output', { type: 'error', text: `[ERROR] ${err.message}`, timestamp: Date.now() });
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
