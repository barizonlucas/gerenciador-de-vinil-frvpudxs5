import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'
const DEFAULT_THRESHOLD = 0.4

interface VerifyRequestBody {
  token?: string
  action?: string
  threshold?: number
}

interface GoogleVerifyResponse {
  success: boolean
  challenge_ts?: string
  hostname?: string
  score?: number
  action?: string
  'error-codes'?: string[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    })
  }

  let body: VerifyRequestBody | null = null
  try {
    body = (await req.json()) as VerifyRequestBody
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Requisição inválida.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const token = body?.token
  const expectedAction = body?.action || 'default'
  const threshold = body?.threshold ?? DEFAULT_THRESHOLD

  if (!token) {
    return new Response(JSON.stringify({ error: 'Token reCAPTCHA ausente.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const secret = Deno.env.get('RECAPTCHA_SECRET_KEY')
  if (!secret) {
    return new Response(
      JSON.stringify({
        error: 'RECAPTCHA_SECRET_KEY não configurada no Supabase.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }

  const params = new URLSearchParams({
    secret,
    response: token,
  })

  let verification: GoogleVerifyResponse | null = null
  try {
    const googleRes = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    verification = (await googleRes.json()) as GoogleVerifyResponse
  } catch (err) {
    console.error('Erro ao validar reCAPTCHA:', err)
    return new Response(
      JSON.stringify({
        error: 'Falha ao validar o reCAPTCHA. Tente novamente.',
      }),
      {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }

  const { success, score = 0, action: returnedAction } = verification

  if (!success) {
    return new Response(
      JSON.stringify({
        error: 'Validação do reCAPTCHA falhou.',
        details: verification['error-codes'] ?? null,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }

  if (returnedAction && returnedAction !== expectedAction) {
    return new Response(
      JSON.stringify({
        error: 'Ação informada no reCAPTCHA não confere.',
        score,
        action: returnedAction,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }

  if (score < threshold) {
    return new Response(
      JSON.stringify({
        error: 'Score do reCAPTCHA abaixo do permitido.',
        score,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }

  return new Response(
    JSON.stringify({
      success: true,
      score,
      action: returnedAction ?? expectedAction,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  )
})
