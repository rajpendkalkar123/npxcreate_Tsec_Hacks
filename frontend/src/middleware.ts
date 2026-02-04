// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('finternet_auth')?.value
  const { pathname } = request.nextUrl

  const isDashboardPage = pathname.startsWith('/dashboard')
  const isLoginPage = pathname === '/' || pathname === '/login'

  if (isDashboardPage && !authToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isLoginPage && authToken && pathname !== '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest|icon-).*)'],
}
