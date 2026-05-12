interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Regulations.gov MCP — federal regulatory dockets, documents, public comments
 *
 * Complement to `federal-register` (which has only the metadata layer). This
 * pack reaches into individual rulemaking dockets and the comments filed
 * against them.
 *
 * API: https://open.gsa.gov/api/regulationsgov/
 * Auth: header `X-Api-Key`. Free tier 1,000 req/hour with a data.gov key.
 *
 * Tools:
 * - search_dockets:   find dockets by query / agency / type
 * - get_docket:       single docket with metadata + linked documents/comments counts
 * - list_documents:   documents within a docket (rules, notices, supporting material)
 * - search_comments:  public comments, filterable by docketId or full-text
 * - get_comment:      single comment text + attachments
 */


const BASE_URL = 'https://api.regulations.gov/v4';

const tools: McpToolExport['tools'] = [
  {
    name: 'search_dockets',
    description:
      'Search regulatory dockets. Filter by free-text query, agency (acronym like "EPA", "FDA"), docket type (Rulemaking / Nonrulemaking), or date range. Returns dockets with title, agency, type, status, document counts.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Full-text search' },
        agency: { type: 'string', description: 'Agency acronym (e.g., "EPA", "FDA", "DOT")' },
        docket_type: { type: 'string', description: 'Rulemaking | Nonrulemaking' },
        last_modified_from: { type: 'string', description: 'YYYY-MM-DD HH:MM:SS or YYYY-MM-DD' },
        last_modified_to: { type: 'string', description: 'YYYY-MM-DD HH:MM:SS or YYYY-MM-DD' },
        page_size: { type: 'number', description: '5-250 (default 25)' },
        page_number: { type: 'number', description: '1-based page' },
      },
      required: [],
    },
  },
  {
    name: 'get_docket',
    description: 'Single docket detail by docketId (e.g., "EPA-HQ-OAR-2021-0317"). Returns full metadata + summary counts.',
    inputSchema: {
      type: 'object',
      properties: {
        docket_id: { type: 'string', description: 'Docket ID' },
      },
      required: ['docket_id'],
    },
  },
  {
    name: 'list_documents',
    description:
      'Documents within a docket (or matching a query). Returns title, type (Rule / Proposed Rule / Notice / Supporting), comment counts, posted date, document ID.',
    inputSchema: {
      type: 'object',
      properties: {
        docket_id: { type: 'string', description: 'Filter to one docket' },
        query: { type: 'string', description: 'Free-text query across documents' },
        document_type: { type: 'string', description: 'Rule | Proposed Rule | Notice | Supporting & Related Material | Other' },
        page_size: { type: 'number', description: '5-250' },
        page_number: { type: 'number', description: '1-based page' },
      },
      required: [],
    },
  },
  {
    name: 'search_comments',
    description:
      'Public comments filed on a docket or document. Filter by docketId, documentId (e.g., "EPA-HQ-OAR-2021-0317-0001"), free-text, or date.',
    inputSchema: {
      type: 'object',
      properties: {
        docket_id: { type: 'string', description: 'Filter to a docket' },
        document_id: { type: 'string', description: 'Filter to a single document' },
        query: { type: 'string', description: 'Free-text query' },
        posted_from: { type: 'string', description: 'YYYY-MM-DD' },
        posted_to: { type: 'string', description: 'YYYY-MM-DD' },
        page_size: { type: 'number', description: '5-250' },
        page_number: { type: 'number', description: '1-based page' },
      },
      required: [],
    },
  },
  {
    name: 'get_comment',
    description: 'Single public comment by comment ID. Returns text, submitter, posting date, attachments.',
    inputSchema: {
      type: 'object',
      properties: {
        comment_id: { type: 'string', description: 'Comment ID' },
        include_attachments: { type: 'boolean', description: 'Include attachment list (default true)' },
      },
      required: ['comment_id'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = (args._apiKey as string | undefined)?.trim();
  if (!apiKey) {
    throw new Error(
      'Regulations.gov requires a data.gov API key. Contact the operator about platform credentials (PLATFORM_DATAGOV_KEY), or BYO via ?_apiKey=<key> after registering at https://open.gsa.gov/api/regulationsgov/.',
    );
  }
  switch (name) {
    case 'search_dockets':
      return searchList(apiKey, '/dockets', mapDocketParams(args));
    case 'get_docket':
      return getSingle(apiKey, `/dockets/${encodeURIComponent(reqStr(args, 'docket_id', '"EPA-HQ-OAR-2021-0317"'))}`);
    case 'list_documents':
      return searchList(apiKey, '/documents', mapDocumentParams(args));
    case 'search_comments':
      return searchList(apiKey, '/comments', mapCommentParams(args));
    case 'get_comment': {
      const params = new URLSearchParams();
      if (args.include_attachments !== false) params.set('include', 'attachments');
      return getSingle(
        apiKey,
        `/comments/${encodeURIComponent(reqStr(args, 'comment_id', '"<comment_id>"'))}`,
        params,
      );
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required argument "${key}" is missing or empty. Pass a string like ${example}.`);
  }
  return v;
}

async function regFetch<T>(apiKey: string, path: string, params: URLSearchParams): Promise<T> {
  const url = `${BASE_URL}${path}${params.toString() ? `?${params}` : ''}`;
  const res = await fetch(url, {
    headers: { 'X-Api-Key': apiKey, Accept: 'application/vnd.api+json' },
  });
  if (res.status === 401 || res.status === 403) throw new Error('Regulations.gov: unauthorized — check the data.gov key');
  if (res.status === 404) throw new Error('Regulations.gov: not found (HTTP 404)');
  if (res.status === 429) throw new Error('Regulations.gov: rate-limit (HTTP 429) — free tier 1,000 req/hour');
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Regulations.gov error: ${res.status} ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

function mapDocketParams(args: Record<string, unknown>): URLSearchParams {
  const p = new URLSearchParams();
  if (args.query) p.set('filter[searchTerm]', String(args.query));
  if (args.agency) p.set('filter[agencyId]', String(args.agency).toUpperCase());
  if (args.docket_type) p.set('filter[docketType]', String(args.docket_type));
  if (args.last_modified_from) p.set('filter[lastModifiedDate][ge]', String(args.last_modified_from));
  if (args.last_modified_to) p.set('filter[lastModifiedDate][le]', String(args.last_modified_to));
  p.set('page[size]', String(Math.min(250, Math.max(5, (args.page_size as number) ?? 25))));
  p.set('page[number]', String(Math.max(1, (args.page_number as number) ?? 1)));
  return p;
}

function mapDocumentParams(args: Record<string, unknown>): URLSearchParams {
  const p = new URLSearchParams();
  if (args.query) p.set('filter[searchTerm]', String(args.query));
  if (args.docket_id) p.set('filter[docketId]', String(args.docket_id));
  if (args.document_type) p.set('filter[documentType]', String(args.document_type));
  p.set('page[size]', String(Math.min(250, Math.max(5, (args.page_size as number) ?? 25))));
  p.set('page[number]', String(Math.max(1, (args.page_number as number) ?? 1)));
  return p;
}

function mapCommentParams(args: Record<string, unknown>): URLSearchParams {
  const p = new URLSearchParams();
  if (args.query) p.set('filter[searchTerm]', String(args.query));
  if (args.docket_id) p.set('filter[docketId]', String(args.docket_id));
  if (args.document_id) p.set('filter[commentOnId]', String(args.document_id));
  if (args.posted_from) p.set('filter[postedDate][ge]', String(args.posted_from));
  if (args.posted_to) p.set('filter[postedDate][le]', String(args.posted_to));
  p.set('page[size]', String(Math.min(250, Math.max(5, (args.page_size as number) ?? 25))));
  p.set('page[number]', String(Math.max(1, (args.page_number as number) ?? 1)));
  return p;
}

interface JsonApiResource {
  id?: string;
  type?: string;
  attributes?: Record<string, unknown>;
  links?: { self?: string };
  relationships?: Record<string, unknown>;
}

interface JsonApiListResp {
  data?: JsonApiResource[];
  meta?: { totalElements?: number; pageNumber?: number; pageSize?: number; totalPages?: number };
  links?: Record<string, string>;
}

interface JsonApiSingleResp {
  data?: JsonApiResource;
  included?: JsonApiResource[];
}

function normalizeResource(r: JsonApiResource) {
  return { id: r.id ?? null, type: r.type ?? null, ...(r.attributes ?? {}) };
}

async function searchList(apiKey: string, path: string, params: URLSearchParams) {
  const data = await regFetch<JsonApiListResp>(apiKey, path, params);
  return {
    total: data.meta?.totalElements ?? null,
    page: data.meta?.pageNumber ?? null,
    page_size: data.meta?.pageSize ?? null,
    total_pages: data.meta?.totalPages ?? null,
    returned: data.data?.length ?? 0,
    results: (data.data ?? []).map(normalizeResource),
  };
}

async function getSingle(apiKey: string, path: string, params?: URLSearchParams) {
  const data = await regFetch<JsonApiSingleResp>(apiKey, path, params ?? new URLSearchParams());
  if (!data.data) throw new Error('Regulations.gov: empty data');
  const main = normalizeResource(data.data);
  const included = (data.included ?? []).map(normalizeResource);
  return included.length > 0 ? { ...main, included } : main;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
