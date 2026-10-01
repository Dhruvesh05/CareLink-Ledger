import { env } from "../config/env";

export class ApiError extends Error {
  status: number;
  code?: string;
  payload?: unknown;

  constructor(status: number, message: string, payload?: unknown, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
    this.code = code;
  }
}

type RequestOptions = RequestInit & {
  token?: string;
  timeoutMs?: number;
};

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = normalizeBaseUrl(env.apiBaseUrl);
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 30000;
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(options.headers ?? {});
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!isFormData && !(options.body instanceof Blob) && !headers.has("Content-Type") && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
      body: options.body,
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("carelink_auth");
        window.dispatchEvent(new Event("carelink:auth-expired"));
      }

      const message =
        typeof payload === "object" && payload !== null && "message" in payload
          ? String((payload as { message?: string }).message)
          : "Request failed";
      const code =
        typeof payload === "object" && payload !== null && "code" in payload
          ? String((payload as { code?: string }).code)
          : undefined;
      throw new ApiError(response.status, message, payload, code);
    }

    if (payload && typeof payload === "object" && "data" in payload) {
      return (payload as { data: T }).data as T;
    }

    return payload as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(408, "Request timed out", undefined, "timeout");
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(0, "Network error while reaching the backend", undefined, "network");
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function apiGet<T>(path: string, token?: string, init?: RequestInit): Promise<T> {
  return request<T>(path, { method: "GET", ...init, token });
}

export function apiPost<T>(path: string, body: unknown, token?: string, init?: RequestInit): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: body instanceof FormData || body instanceof Blob ? body : JSON.stringify(body ?? {}),
    ...init,
    token,
  });
}

export function apiPut<T>(path: string, body: unknown, token?: string, init?: RequestInit): Promise<T> {
  return request<T>(path, {
    method: "PUT",
    body: body instanceof FormData || body instanceof Blob ? body : JSON.stringify(body ?? {}),
    ...init,
    token,
  });
}

export function apiDelete<T>(path: string, token?: string, init?: RequestInit): Promise<T> {
  return request<T>(path, { method: "DELETE", ...init, token });
}

export default request;
