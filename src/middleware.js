import { NextResponse } from 'next/server';

export function middleware(request) {
  // We'll use a simpler client-side protection for now as Firebase Auth 
  // requires more complex setup for Edge Middleware (like cookie sessions).
  // But we can add a basic placeholder here.
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/orders/:path*', '/cart/:path*', '/checkout/:path*'],
};
