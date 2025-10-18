import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

const GEMINI_API_KEY = Deno.env.get('gemini')
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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

    const prompt = `Conte a história do álbum "${albumTitle}" de ${artist}, lançado em ${releaseYear}. Fale sobre a concepção do disco, o momento da banda/artista na época, e o contexto histórico e cultural, tanto global quanto no Brasil, se relevante. A resposta deve ser um texto narrativo e informativo em português do Brasil, com no mínimo 3 parágrafos.`

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
