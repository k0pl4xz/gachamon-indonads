import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value
  const { pathname } = request.nextUrl

  // 1. Skip semua static files dan API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') || 
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // 2. Proteksi route admin
  if (pathname.startsWith('/admin')) {
    // Sudah login → redirect ke dashboard
    if (authToken && pathname === '/admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
    // Belum login → block akses dashboard
    if (!authToken && pathname.startsWith('/admin/dashboard')) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  // 3. Handle root path (/)
  if (pathname === '/') {
    return NextResponse.next() // Biarkan halaman utama terbuka
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
}