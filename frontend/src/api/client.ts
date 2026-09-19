const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type TokenReader = () => string | null;
type UnauthorizedHandler = (message: string) => void;

let readToken: TokenReader = () => null;
let onUnauthorized: UnauthorizedHandler = () => undefined;

/** Wired up once by AuthProvider so every request carries the session token. */
export function configureApi(options: {
  getToken: TokenReader;
  onUnauthorized: UnauthorizedHandler;
}): void {
  readToken = options.getToken;
  onUnauthorized = options.onUnauthorized;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Skip the global logout-on-401 (used by login/signup, where 401 is normal). */
  allowUnauthorized?: boolean;
}

/** Nest's ValidationPipe returns `message` as a string or an array of strings. */
function extractMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message: unknown }).message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
  }
  return fallback;
}

export async function request<T>(
  path: string,
  { method = 'GET', body, allowUnauthorized = false }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = readToken();

  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is the API running?', 0);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const raw = await response.text();
  const payload: unknown = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    const message = extractMessage(payload, `Request failed (${response.status})`);
    if (response.status === 401 && !allowUnauthorized) {
      // The session is gone — expired, revoked by logout, or never valid.
      onUnauthorized(message);
    }
    throw new ApiError(message, response.status);
  }

  return payload as T;
}
