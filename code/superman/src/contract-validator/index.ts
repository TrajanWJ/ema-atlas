/**
 * API Contract Validator — orchestrator.
 *
 * Coordinates server scanning, client scanning, and contract matching
 * to find mismatches between frontend API calls and backend route definitions.
 */

import { log } from '../logger.js';
import type { ContractMismatch } from '../types.js';
import { scanServerContracts } from './server-scanner.js';
import { scanClientCalls } from './client-scanner.js';
import { matchContracts } from './contract-matcher.js';

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
};

/**
 * Validate API contracts between client and server code.
 *
 * 1. Scans server routes -> ApiContract[]
 * 2. Scans client calls  -> ClientCall[]
 * 3. Matches and finds mismatches -> ContractMismatch[]
 * 4. Sorts by severity (critical first)
 */
export async function validateContracts(projectPath: string): Promise<ContractMismatch[]> {
  log('sync', 'Starting API contract validation', { projectPath });

  // 1. Scan server routes
  const contracts = await scanServerContracts(projectPath);

  // 2. Scan client calls
  const calls = await scanClientCalls(projectPath);

  // 3. Match and find mismatches
  const mismatches = matchContracts(contracts, calls);

  // 4. Sort by severity (critical > high > medium)
  mismatches.sort((a, b) => {
    const aOrder = SEVERITY_ORDER[a.severity] ?? 99;
    const bOrder = SEVERITY_ORDER[b.severity] ?? 99;
    return aOrder - bOrder;
  });

  log('sync', 'API contract validation complete', {
    serverRoutes: contracts.length,
    clientCalls: calls.length,
    mismatches: mismatches.length,
  });

  return mismatches;
}
