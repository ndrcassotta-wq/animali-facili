import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function isSafeRedirect(path: string): boolean {
  return (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !path.includes(':')
  )
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'
  const redirectTo = isSafeRedirect(next) ? next : '/home'

  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const isLocalEnv = process.env.NODE_ENV === 'development'

  const baseUrl =
    isLocalEnv || !forwardedHost
      ? origin
      : `${forwardedProto}://${forwardedHost}`

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('OAuth exchange error:', error)

    const params = new URLSearchParams({
      error: 'auth_failed',
      message: error.message,
    })

    return NextResponse.redirect(`${baseUrl}/login?${params.toString()}`)
  }

  return NextResponse.redirect(`${baseUrl}${redirectTo}`)
}