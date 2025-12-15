import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Allow all static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Allow login page
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // For all other routes, allow access
  // (Auth check will be done client-side)
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
