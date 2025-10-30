import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.15.0'

async function fileToGenerativePart(file: File) {
  const base64encodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
  return {
    inlineData: {
      data: base64encodedData,
      mimeType: file.type,
    },
  }
}

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

    const formData = await req.formData()
    const imageFile = formData.get('cover') as File | null
    if (!imageFile) {
      return new Response(JSON.stringify({ error: 'Image file is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not set.')
    }
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })

    const prompt = `
      Analyze this image of a vinyl record cover.
      Identify the artist and the album title.
      Return the response as a JSON object with the keys "artist" and "album_title".
      If you cannot identify the artist or album, return a JSON object with null values for both.
      Example: { "artist": "Pink Floyd", "album_title": "The Dark Side of the Moon" }
    `
    const imagePart = await fileToGenerativePart(imageFile)
    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    const text = response.text()

    const jsonString = text
      .replace(/```json\n/g, '')
      .replace(/```/g, '')
      .trim()
    const identifiedData = JSON.parse(jsonString)

    return new Response(JSON.stringify(identifiedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in identify-album-cover:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
