import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const GEMINI_API_KEY = Deno.env.get('gemini')
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Handle CORS preflight requests
const handleCors = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  if (!GEMINI_API_KEY) {
    console.error('Missing Gemini API key secret.')
    return new Response(
      JSON.stringify({ error: 'AI service is not configured.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }

  try {
    const url = new URL(req.url)
    const albumTitle = url.searchParams.get('albumTitle')
    const artist = url.searchParams.get('artist')
    const releaseYear = url.searchParams.get('releaseYear')

    if (!albumTitle || !artist || !releaseYear) {
      return new Response(
        JSON.stringify({
          error:
            'Missing required query parameters: albumTitle, artist, releaseYear',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    const prompt = `Como historiador musical, resuma brevemente a história do álbum "${albumTitle}" de ${artist} (${releaseYear}). 
    Foque nos fatos mais importantes sobre o disco e seu impacto.
    Responda em português do Brasil em 2 parágrafos concisos.`

    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    })

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text()
      console.error('Gemini API error:', errorBody)
      throw new Error('Failed to fetch history from AI service.')
    }

    const geminiData = await geminiResponse.json()
    const history =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Não foi possível gerar a história para este disco.'

    return new Response(JSON.stringify({ history }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
