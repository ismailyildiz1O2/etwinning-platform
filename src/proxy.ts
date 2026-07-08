import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Next.js 16 Proxy runs on Node.js runtime
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // We rely on getToken to retrieve the JWT. It requires the secret.
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });

  if (!token) {
    // If not authenticated, redirect to login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Ensure the proxy doesn't run on public routes and static assets
export const config = {
  matcher: [
    "/((?!api/auth|auth|_next/static|_next/image|favicon.ico).*)"
  ],
};
