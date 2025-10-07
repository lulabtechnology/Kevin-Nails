import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  // Proteger la página /dashboard (solo si hay cookie admin_token)
  if (pathname.startsWith('/dashboard')) {
    const token = req.cookies.get('admin_token')?.value
    if (!token) {
      const url = new URL('/(auth)/login', req.url)
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard']
}
