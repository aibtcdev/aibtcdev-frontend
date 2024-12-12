import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Define routes with different authentication strategies
const protectedPaths = {
  '/chat': { type: 'component' },
  '/crews': { type: 'component' },
  '/marketplace': { type: 'component' },
  '/profile': { type: 'component' },
  '/admin': { type: 'redirect' },
  '/admin/:path*': { type: 'redirect' },
} as const;

export const updateSession = async (request: NextRequest) => {
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "middleware: missing supabase URL or supabase anon key in env vars"
      );
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
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

    // Get the user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // Set authentication headers
    response.headers.set(
      'x-authenticated',
      !userError && !!user ? 'true' : 'false'
    );

    // If it's a protected route and there's no user
    if (matchedPath && (userError || !user)) {
      const [, config] = matchedPath;

      switch (config.type) {
        case 'redirect': {
          // Redirect to connect page with original destination
          const connectUrl = new URL("/connect", request.url);
          connectUrl.searchParams.set('redirect', pathname);
          return NextResponse.redirect(connectUrl);
        }
        case 'component': {
          // Allow rendering but mark as unauthorized
          response.headers.set('x-auth-status', 'unauthorized');
          break;
        }
      }
    }

    // Admin route specific logic
    if (pathname.startsWith("/admin")) {
      if (userError || !user) {
        // If no user, redirect to home
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Check user role in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || !profileData || profileData.role !== "Admin") {
        // If not admin, redirect to chat
        return NextResponse.redirect(new URL("/chat", request.url));
      }
    }

    // Authenticated routes
    if (!userError && user) {
      response.headers.set('x-auth-status', 'authorized');
    }

    return response;
  } catch (error) {
    console.error("Middleware authentication error:", error);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};

