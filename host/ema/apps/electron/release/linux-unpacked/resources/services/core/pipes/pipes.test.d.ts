/**
 * Pipes subservice tests.
 *
 * Hermetic: stubs `services/persistence/db.js` with an in-memory better-sqlite3
 * handle the same way `core/blueprint/blueprint.test.ts` does. Composer calls
 * use a tmpdir artifactsRoot so no test writes to `~/.local/share/ema/`.
 *
 * Covered cases:
 *   1. Registry reports 21/21/5 counts and every Appendix A.3 trigger + action
 *   2. `registry.hasTrigger / hasAction / hasTransform` reject unknowns
 *   3. DDL bootstrap creates `pipes` + `pipe_runs` tables
 *   4. createPipe persists, listPipes filters by trigger + enabled
 *   5. togglePipe enables/disables
 *   6. executePipe happy path: trigger → filter → tasks:create writes a run
 *   7. filter transform halts the run with status "halted"
 *   8. executePipe records failures when an action throws
 *   9. claude:run action goes through Composer and writes response.md
 *  10. Router file exists at the auto-loader path
 *  11. MCP tools expose the expected names
 *  12. pipeBus fans out to the executor on trigger
 */
export {};
//# sourceMappingURL=pipes.test.d.ts.map