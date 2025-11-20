// src/lib/api.ts
// Garantimos um fallback para o domínio de funções do Supabase para evitar rota undefined em prod.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const apiBaseFromEnv = import.meta.env.VITE_API_BASE_URL

const stripTrailingSlash = (value?: string) =>
  value?.endsWith('/') ? value.slice(0, -1) : value

const API_BASE =
  stripTrailingSlash(apiBaseFromEnv) ||
  (SUPABASE_URL ? `${stripTrailingSlash(SUPABASE_URL)}/functions/v1` : '')

export const ENDPOINTS = {
  SEARCH_DISCOGS: `${API_BASE}/search-discogs`,
  IDENTIFY_ALBUM_COVER: `${API_BASE}/identify-album-cover`,
} as const
