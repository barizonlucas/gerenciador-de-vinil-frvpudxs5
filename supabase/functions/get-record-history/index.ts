import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from '@supabase/supabase-js'
import { corsHeaders as sharedCorsHeaders } from '../_shared/cors.ts'

const GEMINI_API_KEY = Deno.env.get('gemini')
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const corsHeaders = {
  ...sharedCorsHeaders,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    })

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
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

    const { albumTitle, artist, releaseYear } = await req.json()

    if (!albumTitle || !artist || !releaseYear) {
      return new Response(
        JSON.stringify({
          error:
            'Missing required body parameters: albumTitle, artist, releaseYear',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    const prompt = `Como um historiador de música, escreva um resumo conciso sobre a história e o impacto do álbum "${albumTitle}" de ${artist}, lançado em ${releaseYear}. Formate a resposta em HTML, usando parágrafos (<p>). A resposta deve ter no máximo 2 parágrafos e ser em português do Brasil.`

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
      '<p>Não foi possível gerar a história para este disco.</p>'

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
