/**
 * Contract matcher — compares client calls against server contracts
 * and detects mismatches.
 */

import { log } from '../logger.js';
import type { ApiContract, ClientCall, ContractMismatch } from '../types.js';

/**
 * Normalize a URL for matching purposes.
 *
 * - Strips trailing slashes
 * - Converts Express params (:id) to a generic placeholder
 * - Converts template-literal params (:param) to the same placeholder
 * - Converts numeric path segments (123, 456) to the placeholder
 */
function normalizeUrl(url: string): string {
  return url
    .replace(/\/+$/, '')              // strip trailing slashes
    .replace(/:[a-zA-Z_]\w*\*?/g, ':_')  // :id, :slug*, :param -> :_
    .replace(/\/\d+/g, '/:_')         // /123 -> /:_
    .toLowerCase();
}

/**
 * Check if a client URL could match a server endpoint.
 * Handles dynamic segments, template literals, and numeric IDs.
 */
function urlsMatch(clientUrl: string, serverEndpoint: string): boolean {
  const normClient = normalizeUrl(clientUrl);
  const normServer = normalizeUrl(serverEndpoint);

  if (normClient === normServer) return true;

  // Split into segments and compare
  const clientParts = normClient.split('/').filter(Boolean);
  const serverParts = normServer.split('/').filter(Boolean);

  if (clientParts.length !== serverParts.length) return false;

  for (let i = 0; i < clientParts.length; i++) {
    const cp = clientParts[i];
    const sp = serverParts[i];

    // Both are placeholders or both match literally
    if (cp === sp) continue;

    // Either side is a dynamic placeholder
    if (cp === ':_' || sp === ':_') continue;

    return false;
  }

  return true;
}

/**
 * Match client calls against server contracts and return mismatches.
 */
export function matchContracts(
  contracts: ApiContract[],
  calls: ClientCall[],
): ContractMismatch[] {
  log('sync', 'Matching contracts', {
    serverRoutes: contracts.length,
    clientCalls: calls.length,
  });

  const mismatches: ContractMismatch[] = [];
  const matchedContractIndices = new Set<number>();

  for (const call of calls) {
    // Find all server contracts whose URL matches this client call
    const urlMatches: Array<{ contract: ApiContract; index: number }> = [];
    for (let i = 0; i < contracts.length; i++) {
      if (urlsMatch(call.url, contracts[i].endpoint)) {
        urlMatches.push({ contract: contracts[i], index: i });
      }
    }

    if (urlMatches.length === 0) {
      // No server route matches this client call at all
      mismatches.push({
        type: 'MISSING_ENDPOINT',
        clientCall: call,
        severity: 'critical',
        description: `Client calls ${call.method} ${call.url} but no server route handles this endpoint`,
        suggestedFix: `Create a server route handler for ${call.method} ${call.url}`,
      });
      continue;
    }

    // Check if any match has the right HTTP method
    const methodMatch = urlMatches.find(
      (m) => m.contract.method === call.method,
    );

    if (methodMatch) {
      // Perfect match
      matchedContractIndices.add(methodMatch.index);
    } else {
      // URL matches but method doesn't
      const bestMatch = urlMatches[0];
      matchedContractIndices.add(bestMatch.index);

      mismatches.push({
        type: 'METHOD_MISMATCH',
        clientCall: call,
        serverContract: bestMatch.contract,
        severity: 'high',
        description: `Client uses ${call.method} ${call.url} but server only handles ${urlMatches.map((m) => m.contract.method).join(', ')} for this endpoint`,
        suggestedFix: `Either change the client to use ${bestMatch.contract.method} or add a ${call.method} handler on the server`,
      });
    }
  }

  // Find unused server endpoints (never called by any client)
  for (let i = 0; i < contracts.length; i++) {
    if (matchedContractIndices.has(i)) continue;

    const contract = contracts[i];

    // Check if any client call matches this contract's URL at all
    const hasAnyClientMatch = calls.some((c) => urlsMatch(c.url, contract.endpoint));
    if (!hasAnyClientMatch) {
      mismatches.push({
        type: 'UNUSED_ENDPOINT',
        serverContract: contract,
        severity: 'medium',
        description: `Server endpoint ${contract.method} ${contract.endpoint} is never called by any client code`,
        suggestedFix: `Remove unused endpoint or add client code to call ${contract.method} ${contract.endpoint}`,
      });
    }
  }

  // Detect untyped responses (server routes without responseType)
  for (const contract of contracts) {
    if (!contract.responseType) {
      // Only flag if the route is actually used by clients
      const isUsed = calls.some((c) => urlsMatch(c.url, contract.endpoint));
      if (isUsed) {
        mismatches.push({
          type: 'UNTYPED_RESPONSE',
          serverContract: contract,
          severity: 'medium',
          description: `Server endpoint ${contract.method} ${contract.endpoint} has no typed response`,
          suggestedFix: `Add a TypeScript response type to ${contract.method} ${contract.endpoint} in ${contract.file}`,
        });
      }
    }
  }

  log('sync', 'Contract matching complete', {
    mismatches: mismatches.length,
    critical: mismatches.filter((m) => m.severity === 'critical').length,
    high: mismatches.filter((m) => m.severity === 'high').length,
    medium: mismatches.filter((m) => m.severity === 'medium').length,
  });

  return mismatches;
}
