import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

const DISCOGS_API_URL = 'https://api.discogs.com/database/search'

interface DiscogsResult {
  id: number
  title: string
  year?: string
  cover_image: string
  genre: string[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const discogsKey = Deno.env.get('DISCOGS_KEY')
    const discogsSecret = Deno.env.get('DISCOGS_SECRET')

    if (!discogsKey || !discogsSecret) {
      throw new Error('Discogs API credentials are not set.')
    }

    const searchParams = new URLSearchParams({
      q: query,
      type: 'release',
      per_page: '10',
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
      const [artist, ...titleParts] = item.title.split(' - ')
      const albumTitle = titleParts.join(' - ')
      return {
        id: item.id,
        artist: artist?.trim(),
        albumTitle: albumTitle?.trim() || artist?.trim(), // Handle cases with no album title
        year: item.year,
        coverArtUrl: item.cover_image,
        genre: item.genre?.[0],
      }
    })

    return new Response(JSON.stringify(formattedResults), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
