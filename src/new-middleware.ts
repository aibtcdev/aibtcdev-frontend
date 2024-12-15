import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fetchWithAuth } from './helpers/fetchWithAuth';

// Define routes with different authentication strategies
const protectedPaths = {
    '/chat': { type: 'component' },
    '/crews': { type: 'component' },
    '/marketplace': { type: 'component' },
    '/profile': { type: 'component' },
    '/admin': { type: 'redirect' },
    '/admin/:path*': { type: 'redirect' },
} as const;

export async function middleware(request: NextRequest) {
    // Create an unmodified response
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // Check if current path matches a protected route
    const pathname = request.nextUrl.pathname;
    const matchedPath = Object.entries(protectedPaths).find(([route]) => {
        const pattern = new RegExp(
            `^${route.replace(/\/:path\*/, '(/.*)?').replace(/\//g, '\\/')}$`
        );
        return pattern.test(pathname);
    });

    // Get the session token from the cookies
    const sessionToken = request.cookies.get('sessionToken')?.value;
    const stxAddress = request.cookies.get('stxAddress')?.value;

    // Verify the session
    let isAuthenticated = false;
    let userRole = null;

    if (sessionToken && stxAddress) {
        try {
            const verifyResponse = await fetchWithAuth('/auth/verify-session-token', {
                method: 'POST',
                body: JSON.stringify({ data: sessionToken }),
            });

            if (verifyResponse.success) {
                isAuthenticated = true;
                // Fetch user role if needed for admin routes
                if (pathname.startsWith('/admin')) {
                    const { role } = await fetchWithAuth(`/profiles/role?address=${stxAddress}`);
                    userRole = role;
                }
            }
        } catch (error) {
            console.error('Error verifying session token:', error);
        }
    }

    // Set authentication headers
    response.headers.set('x-authenticated', isAuthenticated ? 'true' : 'false');

    // Special handling for admin routes
    if (pathname.startsWith('/admin')) {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        if (userRole !== 'Admin') {
            return NextResponse.redirect(new URL('/chat', request.url));
        }

        response.headers.set('x-auth-status', 'authorized');
        return response;
    }

    // Handle other protected routes
    if (matchedPath && !isAuthenticated) {
        const [, config] = matchedPath;

        switch (config.type) {
            case 'redirect': {
                const connectUrl = new URL('/connect', request.url);
                connectUrl.searchParams.set('redirect', pathname);
                return NextResponse.redirect(connectUrl);
            }
            case 'component': {
                response.headers.set('x-auth-status', 'unauthorized');
                break;
            }
        }
    }

    // Authenticated routes
    if (isAuthenticated) {
        response.headers.set('x-auth-status', 'authorized');
    }

    return response;
}

export const config = {
    matcher: ['/admin/:path*', '/chat', '/crews', '/marketplace', '/profile'],
};