// @autharis/sdk — client.ts

import { AutharisError } from './errors.js';
import type {
  AdminQueueActInput,
  AdminQueueItem,
  AdminQueueListQuery,
  CreateJobRequestInput,
  Engagement,
  EngagementListQuery,
  Invoice,
  InvoiceListQuery,
  JobListQuery,
  JobRequest,
  Paginated,
  SubmitTimesheetInput,
  Talent,
  TalentListQuery,
  Timesheet,
  TimesheetListQuery,
} from './types.js';

export type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  },
) => Promise<Response>;

export interface AutharisClientOptions {
  readonly baseUrl: string;
  readonly apiKey?: string;
  readonly fetch?: FetchLike;
  readonly defaultHeaders?: Readonly<Record<string, string>>;
}

export interface RequestOptions {
  readonly signal?: AbortSignal;
  readonly headers?: Readonly<Record<string, string>>;
}

function resolveFetch(injected: FetchLike | undefined): FetchLike {
  if (injected) return injected;
  const g = globalThis as { fetch?: FetchLike };
  if (typeof g.fetch === 'function') return g.fetch.bind(globalThis) as FetchLike;
  throw new Error(
    '@autharis/sdk: no fetch implementation found. Pass `fetch` in AutharisClientOptions or run on a platform with globalThis.fetch.',
  );
}

function encodeQuery(query: unknown): string {
  if (!query || typeof query !== 'object') return '';
  const parts: string[] = [];
  for (const [k, v] of Object.entries(query as Record<string, unknown>)) {
    if (v === undefined || v === null) continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

export class AutharisClient {
  readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly fetchImpl: FetchLike;
  private readonly defaultHeaders: Readonly<Record<string, string>>;

  readonly talent: TalentResource;
  readonly jobs: JobsResource;
  readonly engagements: EngagementsResource;
  readonly timesheets: TimesheetsResource;
  readonly invoices: InvoicesResource;
  readonly admin: AdminNamespace;

  constructor(opts: AutharisClientOptions) {
    if (!opts || !opts.baseUrl) {
      throw new Error('@autharis/sdk: `baseUrl` is required.');
    }
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '');
    this.apiKey = opts.apiKey;
    this.fetchImpl = resolveFetch(opts.fetch);
    this.defaultHeaders = opts.defaultHeaders ?? {};

    this.talent = new TalentResource(this);
    this.jobs = new JobsResource(this);
    this.engagements = new EngagementsResource(this);
    this.timesheets = new TimesheetsResource(this);
    this.invoices = new InvoicesResource(this);
    this.admin = new AdminNamespace(this);
  }

  /** @internal */
  async request<T>(
    method: string,
    path: string,
    init: {
      query?: unknown;
      body?: unknown;
      options?: RequestOptions;
    } = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}${encodeQuery(init.query)}`;
    const headers: Record<string, string> = {
      accept: 'application/json',
      ...this.defaultHeaders,
      ...(init.options?.headers ?? {}),
    };
    if (this.apiKey) headers.authorization = `Bearer ${this.apiKey}`;
    let body: string | undefined;
    if (init.body !== undefined) {
      headers['content-type'] = 'application/json';
      body = JSON.stringify(init.body);
    }

    const res = await this.fetchImpl(url, {
      method,
      headers,
      body,
      signal: init.options?.signal,
    });

    if (!res.ok) throw await AutharisError.fromResponse(res);

    if (res.status === 204) return undefined as T;
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) return undefined as T;
    return (await res.json()) as T;
  }
}

// ---------- Resource implementations ----------

class TalentResource {
  constructor(private readonly c: AutharisClient) {}
  list(query?: TalentListQuery, options?: RequestOptions): Promise<Paginated<Talent>> {
    return this.c.request<Paginated<Talent>>('GET', '/talent', { query, options });
  }
  get(id: string, options?: RequestOptions): Promise<Talent> {
    return this.c.request<Talent>('GET', `/talent/${encodeURIComponent(id)}`, { options });
  }
}

class JobsResource {
  constructor(private readonly c: AutharisClient) {}
  list(query?: JobListQuery, options?: RequestOptions): Promise<Paginated<JobRequest>> {
    return this.c.request<Paginated<JobRequest>>('GET', '/jobs', { query, options });
  }
  get(id: string, options?: RequestOptions): Promise<JobRequest> {
    return this.c.request<JobRequest>('GET', `/jobs/${encodeURIComponent(id)}`, { options });
  }
  create(input: CreateJobRequestInput, options?: RequestOptions): Promise<JobRequest> {
    return this.c.request<JobRequest>('POST', '/jobs', { body: input, options });
  }
}

class EngagementsResource {
  constructor(private readonly c: AutharisClient) {}
  list(query?: EngagementListQuery, options?: RequestOptions): Promise<Paginated<Engagement>> {
    return this.c.request<Paginated<Engagement>>('GET', '/engagements', { query, options });
  }
  get(id: string, options?: RequestOptions): Promise<Engagement> {
    return this.c.request<Engagement>('GET', `/engagements/${encodeURIComponent(id)}`, { options });
  }
}

class TimesheetsResource {
  constructor(private readonly c: AutharisClient) {}
  list(query?: TimesheetListQuery, options?: RequestOptions): Promise<Paginated<Timesheet>> {
    return this.c.request<Paginated<Timesheet>>('GET', '/timesheets', { query, options });
  }
  get(id: string, options?: RequestOptions): Promise<Timesheet> {
    return this.c.request<Timesheet>('GET', `/timesheets/${encodeURIComponent(id)}`, { options });
  }
  submit(input: SubmitTimesheetInput, options?: RequestOptions): Promise<Timesheet> {
    return this.c.request<Timesheet>('POST', '/timesheets', { body: input, options });
  }
  approve(id: string, options?: RequestOptions): Promise<Timesheet> {
    return this.c.request<Timesheet>(
      'POST',
      `/timesheets/${encodeURIComponent(id)}/approve`,
      { options },
    );
  }
}

class InvoicesResource {
  constructor(private readonly c: AutharisClient) {}
  list(query?: InvoiceListQuery, options?: RequestOptions): Promise<Paginated<Invoice>> {
    return this.c.request<Paginated<Invoice>>('GET', '/invoices', { query, options });
  }
  get(id: string, options?: RequestOptions): Promise<Invoice> {
    return this.c.request<Invoice>('GET', `/invoices/${encodeURIComponent(id)}`, { options });
  }
  markPaid(id: string, options?: RequestOptions): Promise<Invoice> {
    return this.c.request<Invoice>(
      'POST',
      `/invoices/${encodeURIComponent(id)}/mark-paid`,
      { options },
    );
  }
}

class AdminQueueResource {
  constructor(private readonly c: AutharisClient) {}
  list(
    query?: AdminQueueListQuery,
    options?: RequestOptions,
  ): Promise<Paginated<AdminQueueItem>> {
    return this.c.request<Paginated<AdminQueueItem>>('GET', '/admin/queue', { query, options });
  }
  act(
    id: string,
    input: AdminQueueActInput,
    options?: RequestOptions,
  ): Promise<AdminQueueItem> {
    return this.c.request<AdminQueueItem>(
      'POST',
      `/admin/queue/${encodeURIComponent(id)}/act`,
      { body: input, options },
    );
  }
}

class AdminNamespace {
  readonly queue: AdminQueueResource;
  constructor(c: AutharisClient) {
    this.queue = new AdminQueueResource(c);
  }
}
