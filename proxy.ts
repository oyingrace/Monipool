import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/dashboard', '/deposit', '/create-pool', '/pool']

export function proxy(request: NextRequest): NextResponse {
  const token = request.cookies.get('monipool_token')
  const isProtected = PROTECTED_PATHS.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
