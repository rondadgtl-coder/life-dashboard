import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  if (error || !code || !userId) {
    return NextResponse.redirect(`${appUrl}/dashboard?gcal=error`)
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const redirectUri = `${appUrl}/api/auth/google/callback`

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json()

  if (!tokens.refresh_token) {
    return NextResponse.redirect(`${appUrl}/dashboard?gcal=error&reason=no_refresh_token`)
  }

  // Store refresh token in users table
  const supabase = await createClient()
  await supabase
    .from('users')
    .update({
      google_refresh_token: tokens.refresh_token,
      google_calendar_connected: true,
    })
    .eq('id', userId)

  return NextResponse.redirect(`${appUrl}/dashboard?gcal=connected`)
}
