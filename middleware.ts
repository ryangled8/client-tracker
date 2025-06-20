import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Get the pathname
    const path = req.nextUrl.pathname

    // Check if the user is authenticated
    const isAuthenticated = !!req.nextauth.token

    // Define auth pages
    const isAuthPage = path === "/login" || path === "/register"

    // Redirect rules
    if (isAuthPage) {
      if (isAuthenticated) {
        // If user is authenticated and tries to access auth pages, redirect to home
        return NextResponse.redirect(new URL("/", req.url))
      }
      // If user is not authenticated and tries to access auth pages, allow access
      return null
    }

    // For protected routes
    if (!isAuthenticated) {
      // If user is not authenticated, redirect to login
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Allow access to protected routes for authenticated users
    return null
  },
  {
    callbacks: {
      authorized: () => true, // We'll handle authorization in the middleware function
    },
  },
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login and register pages
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login|register).*)",
  ],
}
