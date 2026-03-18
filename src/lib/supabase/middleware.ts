import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const PUBLIC_ROUTES = [
    '/login',
    '/registrazione',
    '/recupero-password',
    '/aggiorna-password',
  ]

  const isPublic = PUBLIC_ROUTES.some(
    r => pathname === r || pathname.startsWith(r + '/')
  )

  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(user ? '/home' : '/login', request.url)
    )
  }

  if (!user && !isPublic) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (user && isPublic) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return response
}