import dotenv from 'dotenv';
dotenv.config();

export const config = {
  qdrantUrl: process.env.QDRANT_URL || 'http://localhost:6333',
  qdrantCollection: process.env.QDRANT_COLLECTION || 'code-intelligence',
  port: parseInt(process.env.PORT || '3000', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
  targetRepoPath: process.env.TARGET_REPO_PATH || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  maxRetries: 3,
} as const;
