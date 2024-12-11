import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

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
        "middleware: missing supabase url or supabase anon key in env vars"
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

    // Protected routes array
    const protectedRoutes = [
      "/dashboard",
      "/chat",
      "/marketplace",
      "/profile",
      "/admin"
    ];

    // Check if current path is a protected route
    const isProtectedRoute = protectedRoutes.some(route =>
      request.nextUrl.pathname.startsWith(route)
    );

    // Get the user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // If it's a protected route and there's no user
    if (isProtectedRoute && (userError || !user)) {
      // Redirect to connect page with original destination
      const connectUrl = new URL("/connect", request.url);
      connectUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(connectUrl);
    }

    // Admin route specific logic
    if (request.nextUrl.pathname.startsWith("/admin")) {
      if (userError || !user) {
        // If no user, redirect to login
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Check user role in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || !profileData || profileData.role !== "Admin") {
        // If not admin, redirect to dashboard
        return NextResponse.redirect(new URL("/chat", request.url));
      }
    }

    // Redirect logged-in users from root to chat
    if (request.nextUrl.pathname === "/" && !userError && user) {
      return NextResponse.redirect(new URL("/chat", request.url));
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