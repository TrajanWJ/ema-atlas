/**
 * Query decomposer — splits compound queries into sub-queries.
 *
 * Pure heuristic, no LLM call. If the heuristic is wrong, the pipeline
 * still works — it just searches the full query as one string.
 */

import { log } from '../logger.js';

/** Patterns that indicate a compound query connecting two concepts */
const CONNECTION_PATTERNS = [
  /how does (.+?) connect to (.+)/i,
  /how does (.+?) relate to (.+)/i,
  /how does (.+?) interact with (.+)/i,
  /relationship between (.+?) and (.+)/i,
  /connection between (.+?) and (.+)/i,
  /how do (.+?) and (.+?) work together/i,
  /(.+?) vs\.? (.+)/i,
  /compare (.+?) (?:and|with|to) (.+)/i,
];

/** Patterns for "and"-joined distinct topics */
const AND_SPLIT_PATTERN = /^(.+?)\s+and\s+(.+)$/i;

/** Words that suggest the "and" joins related concepts (don't split) */
const RELATED_CONJUNCTIONS = [
  'read and write', 'request and response', 'input and output',
  'create and update', 'add and remove', 'start and stop',
  'open and close', 'send and receive', 'push and pull',
  'upload and download', 'encode and decode', 'encrypt and decrypt',
];

export function decompose(query: string): string[] {
  const trimmed = query.trim();

  // Try connection patterns first
  for (const pattern of CONNECTION_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match && match[1] && match[2]) {
      const parts = [match[1].trim(), match[2].trim()];
      log('query', 'Decomposed query (connection)', { original: trimmed, parts });
      return parts;
    }
  }

  // Try "and" split, but only if the parts are distinct concepts
  const andMatch = trimmed.match(AND_SPLIT_PATTERN);
  if (andMatch && andMatch[1] && andMatch[2]) {
    const lower = trimmed.toLowerCase();
    const isRelated = RELATED_CONJUNCTIONS.some((rc) => lower.includes(rc));
    if (!isRelated) {
      // Check that both parts are substantial (> 3 words each suggests they're real sub-queries)
      const left = andMatch[1].trim();
      const right = andMatch[2].trim();
      if (left.split(/\s+/).length >= 2 && right.split(/\s+/).length >= 2) {
        log('query', 'Decomposed query (and-split)', { original: trimmed, parts: [left, right] });
        return [left, right];
      }
    }
  }

  // No decomposition needed
  return [trimmed];
}
