// @autharis/sdk — errors.ts

import type { ApiError } from './types.js';

export class AutharisError extends Error implements ApiError {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(init: {
    message: string;
    status: number;
    code: string;
    requestId?: string;
    details?: unknown;
  }) {
    super(init.message);
    this.name = 'AutharisError';
    this.status = init.status;
    this.code = init.code;
    this.requestId = init.requestId;
    this.details = init.details;
    // Preserve prototype chain for `instanceof` when compiled to ES5.
    Object.setPrototypeOf(this, AutharisError.prototype);
  }

  static async fromResponse(res: Response): Promise<AutharisError> {
    const requestId =
      res.headers.get('x-request-id') ??
      res.headers.get('x-autharis-request-id') ??
      undefined;

    let body: unknown = undefined;
    let message = `${res.status} ${res.statusText || 'Request failed'}`;
    let code = `http_${res.status}`;

    try {
      const contentType = res.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        body = await res.json();
        if (body && typeof body === 'object') {
          const b = body as Record<string, unknown>;
          if (typeof b.message === 'string') message = b.message;
          if (typeof b.code === 'string') code = b.code;
        }
      } else {
        const text = await res.text();
        if (text) {
          body = text;
          message = text.slice(0, 500);
        }
      }
    } catch {
      // swallow — we'll fall back to status defaults
    }

    return new AutharisError({ message, status: res.status, code, requestId, details: body });
  }
}
