/**
 * API Client Utility for ACCI ALERT
 * Supports:
 * 1. Unified full-stack deployment (same origin, relative /api paths)
 * 2. Separately hosted frontend on Netlify / Vercel with VITE_API_BASE_URL
 * 3. Dynamic in-app backend URL switching for science exhibition demonstrations
 */

const STORAGE_KEY = 'acci_custom_backend_url';

export function getCustomBackendUrl(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY) || null;
  } catch (e) {
    return null;
  }
}

export function setCustomBackendUrl(url: string | null): void {
  try {
    if (!url || !url.trim()) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      let cleaned = url.trim();
      // Remove trailing slash
      cleaned = cleaned.replace(/\/+$/, '');
      localStorage.setItem(STORAGE_KEY, cleaned);
    }
  } catch (e) {
    // LocalStorage unavailable
  }
}

export function getApiBaseUrl(): string {
  // 1. User manual override stored in browser (highest priority for live tests)
  const custom = getCustomBackendUrl();
  if (custom) {
    return custom;
  }

  // 2. Vite environment variable set in Vercel or Netlify dashboard
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 3. Fallback to same-origin relative path (Render, Cloud Run, VPS, local dev)
  return '';
}

export function apiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!base) {
    return normalizedEndpoint;
  }
  return `${base}${normalizedEndpoint}`;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  const fullUrl = apiUrl(endpoint);

  try {
    const res = await fetch(fullUrl, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...(options?.headers || {}),
      },
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data,
        error: data?.error || `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    return {
      ok: true,
      status: res.status,
      data,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error reaching backend server';
    return {
      ok: false,
      status: 0,
      data: null,
      error: `${message}. If hosting separately on Vercel/Netlify, check that your backend URL is online and accessible.`,
    };
  }
}
