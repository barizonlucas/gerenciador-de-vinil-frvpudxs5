import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.15.0'

async function fileToGenerativePart(file: File) {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)),
    )
  }

  return {
    inlineData: {
      data: btoa(binary),
      mimeType: file.type || 'image/jpeg',
    },
  }
}

interface EssenceRequestBody {
  totalRecords: number
  topGenre?: {
    label: string
    count: number
    percentage: number | null
  } | null
  topArtist?: {
    label: string
    count: number
    percentage: number | null
  } | null
  topDecade?: {
    decade: number
    label: string
    share: number | null
  } | null
  topCountry?: {
    label: string
    share: number | null
  } | null
}

const cleanModelOutput = (text: string) =>
  text
    .replace(/```/g, '')
    .replace(/^["']|["']$/g, '')
    .trim()

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? undefined

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
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

    const url = new URL(req.url)
    const modeQuery = url.searchParams.get('mode')
    const contentType = req.headers.get('Content-Type') ?? ''

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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    if (contentType.includes('application/json') || modeQuery === 'essence') {
      let body: (EssenceRequestBody & { mode?: string }) | null = null
      try {
        body = (await req.json()) as EssenceRequestBody & { mode?: string }
      } catch (parseError) {
        console.error('Failed to parse essence request body:', parseError)
        return new Response(
          JSON.stringify({
            error:
              'Não foi possível interpretar o conteúdo enviado. Verifique os dados e tente novamente.',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }

      const requestMode = body?.mode ?? modeQuery

      if (requestMode === 'essence') {
        if (
          !body ||
          typeof body.totalRecords !== 'number' ||
          body.totalRecords <= 0 ||
          !body.topGenre ||
          !body.topArtist
        ) {
          return new Response(
            JSON.stringify({
              message:
                'Sua coleção ainda não tem dados suficientes para formar uma essência musical.',
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
          )
        }

        const { mode, ...essenceSummary } = body

        const prompt = `
          Você receberá um resumo em JSON com métricas de uma coleção de discos de vinil.
          Escreva UMA frase curta (máximo 30 palavras) em português brasileiro que capture o espírito musical dessa coleção.
          O tom deve ser inspirador, acolhedor e cheio de orgulho.
          Não repita os números literalmente; interprete-os de forma criativa.
          Dados:
          ${JSON.stringify(essenceSummary)}
          Responda apenas com a frase.
        `.trim()

        const result = await model.generateContent(prompt)
        const response = await result.response
        const message = cleanModelOutput(response.text())

        return new Response(JSON.stringify({ message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(
        JSON.stringify({
          error: 'Requisição JSON não suportada para este endpoint.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const formData = await req.formData()
    const imageFile = formData.get('cover') as File | null
    if (!imageFile) {
      return new Response(JSON.stringify({ error: 'Image file is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const prompt = `
      You receive a photo of a vinyl record cover.
      Identify the artist name and the album title shown in the cover.
      Respond ONLY with a minified JSON object using the keys "artist" and "album_title".
      If you cannot determine the values, respond with {"artist": null, "album_title": null}.
    `.trim()

    const imagePart = await fileToGenerativePart(imageFile)
    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    const text = response.text()

    const jsonString = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()

    let identifiedData: {
      artist: string | null
      album_title: string | null
    } | null = null

    try {
      identifiedData = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', {
        raw: text,
        cleaned: jsonString,
        parseError,
      })
      return new Response(
        JSON.stringify({
          error:
            'Não foi possível interpretar a resposta da IA. Tente novamente com outra foto.',
        }),
        {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (
      !identifiedData ||
      typeof identifiedData !== 'object' ||
      typeof identifiedData.artist === 'undefined' ||
      typeof identifiedData.album_title === 'undefined'
    ) {
      return new Response(
        JSON.stringify({
          error:
            'A resposta da IA não trouxe informações suficientes. Tente novamente.',
        }),
        {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(JSON.stringify(identifiedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in identify-album-cover:', error)
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Erro inesperado ao identificar a capa.'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
