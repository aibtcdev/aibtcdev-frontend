import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define routes with different authentication strategies
const protectedPaths = [
  '/connect',
  '/chat',
  '/crews',
  '/marketplace',
  '/profile',
  '/admin',
  '/admin/:path*',
];

export async function middleware(request: NextRequest) {
  // Get the session token from the cookies
  const sessionToken = request.cookies.get('sessionToken')?.value;
  const stxAddress = request.cookies.get('stxAddress')?.value;

  // Check current pathname
  const pathname = request.nextUrl.pathname;

  // Authentication verification
  let isAuthenticated = false;
  if (sessionToken && stxAddress) {
    console.log('Attempting to verify session token:', sessionToken);
    try {
      const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_AIBTC_SERVICE_URL}/auth/verify-session-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.NEXT_PUBLIC_AIBTC_SECRET_KEY || '',
        },
        body: JSON.stringify({ data: sessionToken }),
      });

      if (verifyResponse.ok) {
        const responseData = await verifyResponse.json();
        console.log('Verify response:', responseData);

        if (responseData.address === stxAddress) {
          isAuthenticated = true;
          console.log('Session verified successfully');
        } else {
          console.log('Session verification failed: address mismatch');
        }
      } else {
        console.log('Session verification failed: invalid response');
      }
    } catch (error) {
      console.error('Error verifying session token:', error);
    }
  } else {
    console.log('No session token or STX address found in cookies');
  }

  // Log the current path and authentication status
  console.log('Current path:', pathname);
  console.log('Is authenticated:', isAuthenticated);

  // Redirect authenticated users to /chat if they're on the root path
  if (isAuthenticated && (pathname === '/')) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  // Handle protected routes for unauthenticated users
  const isProtectedRoute = protectedPaths.some(route =>
    new RegExp(`^${route.replace(/\/:path\*/, '(/.*)?')}$`).test(pathname)
  );

  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/connect',
    '/chat',
    '/crews',
    '/marketplace',
    '/profile',
    '/admin/:path*'
  ],
};

