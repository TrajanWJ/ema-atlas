// Config helpers. Lane G2.
import { AutharisClient } from '@autharis/sdk';

export interface CliConfig {
  readonly apiUrl: string;
  readonly apiKey?: string;
}

export function loadConfig(): CliConfig {
  const apiUrl = process.env.AUTHARIS_API_URL?.trim() || 'http://localhost:4010';
  const apiKey = process.env.AUTHARIS_API_KEY?.trim() || undefined;
  return { apiUrl, apiKey };
}

export function makeClient(cfg: CliConfig = loadConfig()): AutharisClient {
  return new AutharisClient({ baseUrl: cfg.apiUrl, apiKey: cfg.apiKey });
}
