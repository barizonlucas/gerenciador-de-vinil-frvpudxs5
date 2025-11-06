import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const DISCOGS_API_URL = 'https://api.discogs.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      },
    )

    // Check if the user is authenticated
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { master_id, page = 1 } = await req.json()

    if (!master_id) {
      return new Response(JSON.stringify({ error: 'master_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const discogsKey = Deno.env.get('DISCOGS_KEY')
    const discogsSecret = Deno.env.get('DISCOGS_SECRET')

    if (!discogsKey || !discogsSecret) {
      throw new Error('Discogs API credentials are not set.')
    }

    const versionsUrl = `${DISCOGS_API_URL}/masters/${master_id}/versions?per_page=20&page=${page}`

    const response = await fetch(versionsUrl, {
      headers: {
        'User-Agent': 'TekoVinylManager/1.0',
        Authorization: `Discogs key=${discogsKey}, secret=${discogsSecret}`,
      },
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`Discogs API error: ${response.statusText}`, errorBody)
      throw new Error(`Discogs API error: ${response.statusText}`)
    }

    const data = await response.json()

    const formattedVersions = (data.versions ?? []).map((version: any) => {
      const label =
        Array.isArray(version.label) && version.label.length > 0
          ? version.label.join(', ')
          : (version.label ?? '')
      const year =
        version.year ?? version.released ?? version.released_formatted ?? ''
      const communityStats = version.community ?? version.stats?.community ?? {}
      return {
        id: version.id,
        title: version.title,
        year,
        country: version.country ?? '',
        label,
        thumb: version.thumb,
        catno: version.catno ?? '',
        format: version.format ?? version.formats ?? '',
        community: {
          have:
            communityStats.have ??
            communityStats.in_collection ??
            communityStats.owned ??
            0,
          want:
            communityStats.want ??
            communityStats.in_wantlist ??
            communityStats.wanted ??
            0,
        },
      }
    })

    const sorted = formattedVersions.sort((a, b) => {
      const aIsBrazil = a.country?.toLowerCase() === 'brazil'
      const bIsBrazil = b.country?.toLowerCase() === 'brazil'
      if (aIsBrazil && !bIsBrazil) return -1
      if (!aIsBrazil && bIsBrazil) return 1
      if (b.community.have !== a.community.have) {
        return b.community.have - a.community.have
      }
      return b.community.want - a.community.want
    })

    const formatted = {
      pagination: data.pagination,
      versions: sorted,
    }

    return new Response(JSON.stringify(formatted), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in get-discogs-versions:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
