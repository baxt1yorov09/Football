/**
 * Admin API helper — token refresh bilan.
 * 401 paytida `adminRefreshToken` (yoki `refreshToken`) orqali avtomatik
 * yangi access token oladi va so'rovni qayta yuboradi.
 */

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminAccessToken') || localStorage.getItem('accessToken');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminRefreshToken') || localStorage.getItem('refreshToken');
}

function isAdminToken(): boolean {
  return typeof window !== 'undefined' && !!localStorage.getItem('adminAccessToken');
}

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) return null;
    try {
      const res = await fetch('/api/auth/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const newAccess: string | undefined = data?.access;
      if (!newAccess) return null;
      // qaysi turdagi token edi — o'sha kalitga yozamiz
      if (isAdminToken()) {
        localStorage.setItem('adminAccessToken', newAccess);
      } else {
        localStorage.setItem('accessToken', newAccess);
      }
      // Cookie ham
      try {
        document.cookie = `${isAdminToken() ? 'adminAccessToken' : 'accessToken'}=${newAccess}; path=/; max-age=900`;
      } catch {}
      return newAccess;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export interface AdminApiOptions extends Omit<RequestInit, 'body' | 'method'> {
  method?: string;
  body?: any;
  /** Agar true bo'lsa, body JSON sifatida yuborilmaydi (FormData / blob) */
  rawBody?: boolean;
  /** Javobni JSON sifatida parse qilmaslik */
  rawResponse?: boolean;
}

export async function adminApi<T = any>(
  url: string,
  options: AdminApiOptions = {}
): Promise<T> {
  const { method = 'GET', body, rawBody, rawResponse, headers: extraHeaders, ...rest } = options;

  const buildRequest = (token: string | null): RequestInit => {
    const headers: Record<string, string> = {
      ...(extraHeaders as Record<string, string> | undefined),
    };
    if (!rawBody && body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return {
      ...rest,
      method,
      headers,
      body: rawBody ? body : body !== undefined ? JSON.stringify(body) : undefined,
    };
  };

  let token = getAccessToken();
  let res = await fetch(url, buildRequest(token));

  // 401 yoki TOKEN_INVALID 403 — refresh va qayta urinish
  if (res.status === 401 || res.status === 403) {
    let shouldRetry = res.status === 401;
    if (res.status === 403) {
      try {
        const cloned = res.clone();
        const data = await cloned.json();
        if (data?.code === 'TOKEN_INVALID') shouldRetry = true;
      } catch {}
    }

    if (shouldRetry) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        res = await fetch(url, buildRequest(newToken));
      } else {
        // refresh failed — login sahifasiga
        if (typeof window !== 'undefined') {
          if (isAdminToken()) {
            window.location.href = '/admin/login';
          } else {
            window.location.href = '/auth';
          }
        }
        throw new Error('Sessiya tugadi');
      }
    }
  }

  if (rawResponse) return res as unknown as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Field-level xatoliklarni o'qish: { new_password: ["..."], ... }
    let fieldErr: string | undefined;
    if (data && typeof data === 'object') {
      for (const v of Object.values(data as Record<string, unknown>)) {
        if (Array.isArray(v) && v.length && typeof v[0] === 'string') {
          fieldErr = v[0] as string;
          break;
        }
        if (typeof v === 'string') {
          fieldErr = v;
          break;
        }
      }
    }
    const msg =
      (data as any)?.detail ||
      (data as any)?.error ||
      fieldErr ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

/** Fayl yuklab olish — Blob qaytaradi, refresh bilan. */
export async function adminApiDownload(url: string): Promise<Blob> {
  const res = await adminApi<Response>(url, { rawResponse: true });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.blob();
}
