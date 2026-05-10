// Entry point for the `ema` binary.
//
// Dispatch is intentionally hand-rolled: stdlib-first, zero runtime-cost
// framework, and the grammar lives next to docs/cli/see-agent-work.md.

import { parseArgs } from "./args.js";
import { emitError } from "./output.js";
import { runHelp } from "./commands/help.js";
import { runPing } from "./commands/ping.js";
import { runStatus } from "./commands/status.js";
import { runEvents } from "./commands/events.js";
import { runSwarm } from "./commands/swarm.js";
import { runOrg } from "./commands/org.js";
import { runSpace } from "./commands/space.js";
import { runProject } from "./commands/project.js";
import { runVcalendar } from "./commands/vcalendar.js";
import { runCheckup } from "./commands/checkup.js";
import { runCampaign } from "./commands/campaign.js";
import { runMission } from "./commands/mission.js";
import { runLane } from "./commands/lane.js";
import { runQueue } from "./commands/queue.js";
import { runHandoff } from "./commands/handoff.js";
import { runProblem } from "./commands/problem.js";
import { runAgent } from "./commands/agent.js";
import { runNext } from "./commands/next.js";
import { runTl } from "./commands/tl.js";
import { runBlueprint } from "./commands/blueprint.js";
import { runWiki } from "./commands/wiki.js";
import { runHermes } from "./commands/hermes.js";
import { runHarness } from "./commands/harness.js";
import { runPeer } from "./commands/peer.js";
import { runGap } from "./commands/gap.js";
import { runDoctor } from "./commands/doctor.js";
import { runDesktop } from "./commands/desktop.js";
import { runRecovery } from "./commands/recovery.js";
import { runCwt } from "./commands/cwt.js";
import { runCockpit } from "./commands/cockpit.js";
import { runIntention } from "./commands/intention.js";
import { runActor } from "./commands/actor.js";
import { runIntent } from "./commands/intent.js";
import { runProposal } from "./commands/proposal.js";
import { runCanon } from "./commands/canon.js";
import { runBootstrap } from "./commands/bootstrap.js";
import { runCapability } from "./commands/capability.js";
import { runDb } from "./commands/db.js";
import { runWorkspace } from "./commands/workspace.js";
import { runExecution, runDispatch } from "./commands/execution.js";
import { runProslync } from "./commands/proslync.js";
import { runReadiness } from "./commands/readiness.js";
import { runObserver } from "./commands/observer.js";

async function main(): Promise<number> {
  const [, , cmd, ...rest] = process.argv;
  const args = parseArgs(rest);

  switch (cmd) {
    case undefined:
    case "help":
    case "--help":
    case "-h":
      return runHelp(args);
    case "ping":
      return runPing(args);
    case "status":
      return runStatus(args);
    case "events":
      return runEvents(args);
    case "org":
      return runOrg(args);
    case "space":
      return runSpace(args);
    case "project":
      return runProject(args);
    case "swarm":
      return runSwarm(args);
    case "vcalendar":
      return runVcalendar(args);
    case "checkup":
      return runCheckup(args);
    case "campaign":
      return runCampaign(args);
    case "mission":
      return runMission(args);
    case "lane":
      return runLane(args);
    case "queue":
      return runQueue(args);
    case "handoff":
      return runHandoff(args);
    case "problem":
      return runProblem(args);
    case "blueprint":
      return runBlueprint(args);
    case "wiki":
      return runWiki(args);
    case "hermes":
      return runHermes(args);
    case "harness":
      return runHarness(args);
    case "peer":
      return runPeer(args);
    case "agent":
      return runAgent(args);
    case "next":
      return runNext(args);
    case "tl":
    case "/tl":
      return runTl(args);
    case "gap":
      return runGap(args);
    case "doctor":
      return runDoctor(args);
    case "desktop":
      return runDesktop(args);
    case "recovery":
      return runRecovery(args);
    case "cwt":
      return runCwt(args);
    case "cockpit":
      return runCockpit(args);
    case "intention":
      return runIntention(args);
    case "actor":
      return runActor(args);
    case "intent":
      return runIntent(args);
    case "proposal":
      return runProposal(args);
    case "canon":
      return runCanon(args);
    case "bootstrap":
      return runBootstrap(args);
    case "capability":
      return runCapability(args);
    case "db":
      return runDb(args);
    case "workspace":
      return runWorkspace(args);
    case "execution":
      return runExecution(args);
    case "dispatch":
      return runDispatch(args);
    case "proslync":
      return runProslync(args);
    case "readiness":
      return runReadiness(args);
    case "observer":
      return runObserver(args);
    default:
      emitError(`ema: unknown command "${cmd}"`);
      emitError(`Run "ema help" to list commands.`);
      return 64;
  }
}

main().then(
  (code) => process.exit(code),
  (err) => {
    emitError(`ema: internal error: ${err instanceof Error ? err.stack ?? err.message : String(err)}`);
    process.exit(1);
  }
);
