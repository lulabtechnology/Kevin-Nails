import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Proteger /dashboard: requiere cookie 'admin_token'
  if (pathname.startsWith('/dashboard')) {
    const token = req.cookies.get('admin_token')?.value
    if (!token) {
      const url = new URL('/login', req.url) // <-- OJO: ruta pública es /login
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard'],
}
