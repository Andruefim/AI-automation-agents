const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
const TOKEN_KEY = 'slediq_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token = getToken(), ...init } = options;
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      const j = JSON.parse(text);
      if (j.message) msg = j.message;
    } catch {
      // use text
    }
    throw new Error(msg || `HTTP ${res.status}`);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export { API_BASE, TOKEN_KEY };
