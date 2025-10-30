import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

const DISCOGS_API_URL = 'https://api.discogs.com/database/search'

interface DiscogsResult {
  id: number
  title: string
  year?: string
  cover_image: string
  thumb: string
  genre: string[]
  format: string[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { q, artist, album_title, type = 'release' } = await req.json()

    let searchQuery = q
    if (!searchQuery && artist && album_title) {
      searchQuery = `${artist} ${album_title}`
    }

    if (!searchQuery) {
      return new Response(
        JSON.stringify({ error: 'Search query is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const discogsKey = Deno.env.get('DISCOGS_KEY')
    const discogsSecret = Deno.env.get('DISCOGS_SECRET')

    if (!discogsKey || !discogsSecret) {
      throw new Error('Discogs API credentials are not set.')
    }

    const perPage = type === 'master' ? '1' : '10'

    const searchParams = new URLSearchParams({
      q: searchQuery,
      type: type,
      per_page: perPage,
    })

    const response = await fetch(`${DISCOGS_API_URL}?${searchParams}`, {
      headers: {
        'User-Agent': 'TekoVinylManager/1.0',
        Authorization: `Discogs key=${discogsKey}, secret=${discogsSecret}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Discogs API error: ${response.statusText}`)
    }

    const data = await response.json()

    const formattedResults = data.results.map((item: DiscogsResult) => {
      const [itemArtist, ...titleParts] = item.title.split(' - ')
      const itemAlbumTitle = titleParts.join(' - ')
      return {
        id: item.id,
        artist: itemArtist?.trim(),
        albumTitle: itemAlbumTitle?.trim() || itemArtist?.trim(),
        year: item.year,
        thumb: item.thumb,
        coverArtUrl: item.cover_image,
        genre: item.genre?.[0],
        format:
          item.format?.find((f) => f.toLowerCase().includes('vinyl')) ||
          item.format?.[0],
      }
    })

    return new Response(JSON.stringify({ results: formattedResults }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in search-discogs:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
