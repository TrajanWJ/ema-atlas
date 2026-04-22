/**
 * Cross-encoder reranking using Xenova/ms-marco-MiniLM-L-6-v2.
 * Scores each (query, document) pair for relevance.
 * Optional: skips gracefully if model hasn't downloaded or fails to load.
 */

import { log, logError } from '../logger.js';

const MODEL_NAME = 'Xenova/ms-marco-MiniLM-L-6-v2';

let modelPromise: Promise<{ model: any; tokenizer: any }> | null = null;
let ready = false;
let failed = false;

async function loadModel(): Promise<{ model: any; tokenizer: any }> {
  if (!modelPromise) {
    modelPromise = (async () => {
      try {
        log('embed', `Loading cross-encoder model: ${MODEL_NAME}`);
        const { AutoTokenizer, AutoModelForSequenceClassification } =
          await import('@huggingface/transformers');

        const [tokenizer, model] = await Promise.all([
          AutoTokenizer.from_pretrained(MODEL_NAME),
          AutoModelForSequenceClassification.from_pretrained(MODEL_NAME),
        ]);

        ready = true;
        log('embed', `Cross-encoder model loaded: ${MODEL_NAME}`);
        return { model, tokenizer };
      } catch (err) {
        failed = true;
        logError('embed', `Failed to load cross-encoder model: ${MODEL_NAME}`, err);
        throw err;
      }
    })();
  }
  return modelPromise;
}

export function isCrossEncoderReady(): boolean {
  return ready;
}

export function hasCrossEncoderFailed(): boolean {
  return failed;
}

export interface RerankInput {
  id: string;
  text: string;
}

export interface RerankResult {
  id: string;
  score: number;
}

/**
 * Rerank documents by relevance to query using cross-encoder.
 * Returns documents sorted by relevance score (highest first).
 * If model is not available, returns empty array (caller should skip).
 */
export async function crossEncoderRerank(
  query: string,
  documents: RerankInput[],
  topK?: number,
): Promise<RerankResult[]> {
  if (documents.length === 0) return [];
  if (failed) return [];

  let model: any;
  let tokenizer: any;
  try {
    ({ model, tokenizer } = await loadModel());
  } catch {
    return [];
  }

  const queries = new Array(documents.length).fill(query);
  const texts = documents.map((d) => d.text.slice(0, 512));

  const inputs = tokenizer(queries, {
    text_pair: texts,
    padding: true,
    truncation: true,
  });

  const { logits } = await model(inputs);
  const scores = Array.from(logits.data as Float32Array);

  const ranked: RerankResult[] = documents
    .map((doc, i) => ({ id: doc.id, score: scores[i] }))
    .sort((a, b) => b.score - a.score);

  const result = topK ? ranked.slice(0, topK) : ranked;

  log('query', 'Cross-encoder reranking complete', {
    query: query.slice(0, 60),
    candidates: documents.length,
    topScore: result[0]?.score ?? 0,
  });

  return result;
}
