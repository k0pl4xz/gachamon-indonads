import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value
  const isLoginPage = request.nextUrl.pathname === '/admin'
if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Belum login dan akses dashboard → redirect ke login
  if (!authToken && request.nextUrl.pathname.startsWith('/admin/dashboard')) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // Sudah login dan akses /admin → redirect ke dashboard
  if (authToken && isLoginPage) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)'],
}