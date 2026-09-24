// ─────────────────────────────────────────────────────────────
// Centralized API Client — fetch wrapper with Bearer token
// ─────────────────────────────────────────────────────────────

import { getToken, clearToken, clearUser } from "./auth-store";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

/**
 * Base fetch wrapper that:
 * 1. Prepends /api (or VITE_API_URL/api if configured) to every path
 * 2. Attaches Authorization: Bearer <token> when available
 * 3. Handles 401 → clears auth state
 * 4. Parses JSON responses and throws on non-ok status
 */
async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const endpoint = `${API_BASE_URL}/api${path}`;

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  // On 401, clear stored auth state (token expired or invalid)
  if (res.status === 401) {
    clearToken();
    clearUser();
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      body?.message || body?.error || `Request failed with status ${res.status}`;
    const error = new Error(message) as Error & { status: number; body: unknown };
    error.status = res.status;
    error.body = body;
    throw error;
  }

  return body as T;
}

/** GET /api/<path> */
export function apiGet<T = unknown>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: "GET" });
}

/** POST /api/<path> with JSON body */
export function apiPost<T = unknown>(
  path: string,
  data?: unknown
): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/** PUT /api/<path> with JSON body */
export function apiPut<T = unknown>(
  path: string,
  data?: unknown
): Promise<T> {
  return apiFetch<T>(path, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/** PATCH /api/<path> with JSON body */
export function apiPatch<T = unknown>(
  path: string,
  data?: unknown
): Promise<T> {
  return apiFetch<T>(path, {
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/** DELETE /api/<path> */
export function apiDelete<T = unknown>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: "DELETE" });
}
