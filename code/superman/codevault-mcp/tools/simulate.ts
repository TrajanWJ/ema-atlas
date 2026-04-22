import { getOrRecoverSession } from '../session.ts';
import { simulateFlow } from '../../src/simulation/engine.ts';
import { detectFlows } from '../../src/flow-engine.ts';

export async function simulateFlowByName(flowName: string) {
  const session = await getOrRecoverSession('simulate_flow');

  const flows = detectFlows(session.graph);

  // Find the matching flow
  const flow = flows.find(f =>
    f.name.toLowerCase().includes(flowName.toLowerCase()) ||
    flowName.toLowerCase().includes(f.name.toLowerCase())
  );

  if (!flow) {
    return {
      error: `Flow "${flowName}" not found. Available flows: ${flows.map(f => f.name).join(', ') || 'none detected'}`,
      availableFlows: flows.map(f => f.name),
      hint: 'Try a broader search term, or call analyze_repo to re-index the project.',
    };
  }

  const result = simulateFlow(flow, session.graph);

  return {
    flow: flow.name,
    steps: result.steps.map(s => ({
      userAction: s.userAction,
      handlerFound: s.handlerFound,
      stateTransitionValid: s.stateTransitionValid,
      systemResponseCorrect: s.systemResponseCorrect,
      codeRefs: s.codeRefs,
    })),
    issues: result.issues.map(i => ({
      severity: i.severity,
      description: i.description,
      step: i.step,
      type: i.type,
    })),
    chains: result.chains.map(c => ({
      stepIndex: c.stepIndex,
      complete: c.complete,
      missingLayers: c.missingLayers,
      trace: c.links.map(l => ({
        layer: l.layer,
        function: l.nodeName,
        file: l.filePath,
        line: l.line,
      })),
    })),
    overallValidity: result.overallValidity,
    improvements: result.improvements,
  };
}
