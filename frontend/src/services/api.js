/**
 * WISHBAKE Central API Service
 * Handles base URL resolution for decoupled backend deployment
 */

// If VITE_API_URL is configured (e.g. https://api.wishbake.com), use it.
// Otherwise fallback to relative URL (compatible with Vite dev proxy and unified deployments).
const RAW_BASE_URL = (import.meta.env.VITE_API_URL || '').trim();
export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

export function apiUrl(endpoint) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}

export async function apiFetch(endpoint, options = {}) {
  const url = apiUrl(endpoint);
  return fetch(url, options);
}
