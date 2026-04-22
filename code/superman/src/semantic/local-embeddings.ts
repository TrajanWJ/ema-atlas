/**
 * Local sentence-transformer embeddings via @huggingface/transformers.
 * Uses Xenova/jina-embeddings-v2-base-code — 768D, optimized for code.
 * Falls back to Xenova/all-MiniLM-L6-v2 (384D) if code model fails.
 * Downloads model on first use, runs locally, no API cost.
 */
import { log } from '../logger.js';

/** Active embedding dimension — set during model load */
export let LOCAL_EMBEDDING_DIM = 768;

const CODE_MODEL = 'Xenova/jina-embeddings-v2-base-code';
const FALLBACK_MODEL = 'Xenova/all-MiniLM-L6-v2';
const FALLBACK_DIM = 384;

let extractorPromise: Promise<any> | null = null;
let ready = false;
let activeModelName = CODE_MODEL;

async function getExtractor(): Promise<any> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline } = await import('@huggingface/transformers');

      // Try code-specific model first
      try {
        log('embed', `Loading code embedding model: ${CODE_MODEL}`);
        const extractor = await pipeline('feature-extraction', CODE_MODEL, {
          dtype: 'fp32',
        });
        activeModelName = CODE_MODEL;
        LOCAL_EMBEDDING_DIM = 768;
        ready = true;
        log('embed', `Code embedding model loaded: ${CODE_MODEL} (${LOCAL_EMBEDDING_DIM}D)`);
        return extractor;
      } catch (err) {
        log('embed', `Code model failed, falling back to ${FALLBACK_MODEL}: ${err}`);
      }

      // Fallback to general model
      log('embed', `Loading fallback embedding model: ${FALLBACK_MODEL}`);
      const extractor = await pipeline('feature-extraction', FALLBACK_MODEL, {
        dtype: 'fp32',
      });
      activeModelName = FALLBACK_MODEL;
      LOCAL_EMBEDDING_DIM = FALLBACK_DIM;
      ready = true;
      log('embed', `Fallback embedding model loaded: ${FALLBACK_MODEL} (${LOCAL_EMBEDDING_DIM}D)`);
      return extractor;
    })();
  }
  return extractorPromise;
}

/**
 * Get the name of the currently active embedding model.
 */
export function getActiveModelName(): string {
  return activeModelName;
}

export function isLocalEmbeddingsReady(): boolean {
  return ready;
}

export async function generateLocalEmbedding(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}

export async function generateLocalEmbeddingsBatch(
  texts: string[],
  batchSize: number = 32,
): Promise<number[][]> {
  const extractor = await getExtractor();
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const output = await extractor(batch, { pooling: 'mean', normalize: true });

    if (batch.length === 1) {
      results.push(Array.from(output.data as Float32Array));
    } else {
      const flat = Array.from(output.data as Float32Array);
      for (let j = 0; j < batch.length; j++) {
        results.push(flat.slice(j * LOCAL_EMBEDDING_DIM, (j + 1) * LOCAL_EMBEDDING_DIM));
      }
    }

    if (texts.length > batchSize) {
      log('embed', `Local embeddings batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`);
    }
  }

  return results;
}
