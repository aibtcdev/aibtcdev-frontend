import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/utils/supabase/middleware"

// Define allowed origins
const allowedOrigins = [
  "*",
  "http://localhost:3000",
  "https://fix-version.aibtcdev-frontend-staging.pages.dev",
]

export async function middleware(request: NextRequest) {
  // Check if the request is for an API route
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // Get the origin from the request
    const origin = request.headers.get("origin") || ""

    // For API routes, handle CORS
    const response = NextResponse.next()

    // Set CORS headers for API routes
    const corsOrigin = allowedOrigins.includes(origin) ? origin : "*"

    response.headers.set("Access-Control-Allow-Origin", corsOrigin)
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
    response.headers.set("Access-Control-Max-Age", "86400")

    // Handle OPTIONS request (preflight)
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      })
    }

    return response
  }

  // For non-API routes, update the Supabase session
  return await updateSession(request)
}

// Update the matcher to include API routes while keeping the existing patterns
export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/admin",
  ],
}

