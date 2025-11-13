import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.15.0'

const cleanModelOutput = (text: string) =>
  text
    .replace(/```html/gi, '')
    .replace(/```/g, '')
    .trim()

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      },
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { albumTitle, artist, releaseYear } = await req.json()

    if (!albumTitle || !artist || !releaseYear) {
      return new Response(
        JSON.stringify({
          error: 'albumTitle, artist, and releaseYear are required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY is not configured.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })

    const prompt = `
      Escreva um breve resumo sobre o álbum "${albumTitle}" do artista "${artist}", lançado em ${releaseYear}.
      O texto deve ter entre 80 e 120 palavras, em português do Brasil.
      Foque no contexto histórico, impacto cultural e curiosidades sobre a gravação ou recepção do álbum.
      Formate a resposta em HTML, usando parágrafos (<p>) e negrito (<strong>) para destacar termos importantes.
      Não inclua títulos, apenas o texto.
    `.trim()

    const result = await model.generateContent(prompt)
    const response = await result.response
    const history = cleanModelOutput(response.text())

    return new Response(JSON.stringify({ history }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in get-record-history:', error)
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Erro inesperado ao buscar a história do disco.'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
