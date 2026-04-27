// apps/desktop — centralized SDK client.
// Points at the F6 Fastify service in dev. Override with VITE_AUTHARIS_API.

import { AutharisClient } from '@autharis/sdk';

const baseUrl =
  (import.meta.env?.VITE_AUTHARIS_API as string | undefined) ?? 'http://localhost:4010';

export const api = new AutharisClient({ baseUrl });
export const API_BASE_URL = baseUrl;
