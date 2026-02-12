import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/admin', '/vendor', '/individual', '/customer'];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  if (!isProtected) return NextResponse.next();

  const role = request.cookies.get('active_role')?.value;
  if (!role) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!pathname.startsWith(`/${role.toLowerCase()}`)) {
    return NextResponse.redirect(new URL(`/${role.toLowerCase()}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/vendor/:path*', '/individual/:path*', '/customer/:path*']
};
