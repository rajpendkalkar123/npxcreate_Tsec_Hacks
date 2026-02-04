// // src/middleware.ts
// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'

// export function middleware(request: NextRequest) {
//   // 1. Get the authentication cookie (e.g., 'finternet_auth')
//   const authToken = request.cookies.get('finternet_auth')?.value
//   const { pathname } = request.nextUrl

//   // 2. Define protected and public routes
//   const isDashboardPage = pathname.startsWith('/dashboard')
//   const isLoginPage = pathname === '/'

//   // 3. Logic: Redirect to Login if trying to access dashboard without a token
//   if (isDashboardPage && !authToken) {
//     return NextResponse.redirect(new URL('/', request.url))
//   }

//   // 4. Logic: Redirect to Dashboard if already logged in and trying to access Login
//   if (isLoginPage && authToken) {
//     return NextResponse.redirect(new URL('/dashboard', request.url))
//   }

//   return NextResponse.next()
// }

// // 5. Config: Ensure middleware doesn't run on static files or icons
// export const config = {
//   matcher: [
//     '/((?!api|_next/static|_next/image|favicon.ico|manifest.ts|icon-).*)',
//   ],
// }



// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('finternet_auth')?.value
  const { pathname } = request.nextUrl

  // Define public routes (Landing Page)
  const isPublicPage = pathname === '/'

  // 1. If at root and HAS token, go to dashboard
  if (isPublicPage && authToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 2. If trying to access dashboard and NO token, go to root (Landing Page)
  if (pathname.startsWith('/dashboard') && !authToken) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}