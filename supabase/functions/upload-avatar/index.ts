import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from '@supabase/supabase-js'
import { S3Client } from 's3_lite_client'
import { corsHeaders } from '../_shared/cors.ts'

const S3_ENDPOINT = Deno.env.get('S3_ENDPOINT')!
const S3_ACCESS_KEY_ID = Deno.env.get('S3_ACCESS_KEY_ID')!
const S3_SECRET_ACCESS_KEY = Deno.env.get('S3_SECRET_ACCESS_KEY')!
const S3_BUCKET_NAME = Deno.env.get('S3_BUCKET_NAME')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!

const s3EndpointHost = S3_ENDPOINT
  ? new URL(S3_ENDPOINT).hostname
  : new URL(SUPABASE_URL).hostname

const s3Client = new S3Client({
  endPoint: s3EndpointHost,
  port: 443,
  useSSL: true,
  region: 'us-east-1',
  accessKey: S3_ACCESS_KEY_ID,
  secretKey: S3_SECRET_ACCESS_KEY,
  bucket: S3_BUCKET_NAME,
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const formData = await req.formData()
    const file = formData.get('avatar') as File | null

    if (!file) {
      return new Response(JSON.stringify({ error: 'Missing avatar file' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/${Date.now()}.${fileExt}`

    await s3Client.putObject(filePath, await file.arrayBuffer(), {
      'Content-Type': file.type,
    })

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${S3_BUCKET_NAME}/${filePath}`

    return new Response(JSON.stringify({ publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Upload avatar error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
