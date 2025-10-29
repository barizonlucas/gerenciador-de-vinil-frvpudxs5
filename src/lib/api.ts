// src/lib/api.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL

export const ENDPOINTS = {
  SEARCH_DISCOGS: `${API_BASE}/search-discogs`,
} as const