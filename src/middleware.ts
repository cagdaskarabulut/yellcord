import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname;

    // Auth sayfalarına giriş yapmış kullanıcıların erişimini engelle
    if (path.startsWith("/login") || path.startsWith("/register")) {
      if (req.nextauth.token) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Auth sayfalarına herkesin erişimine izin ver
        if (path.startsWith("/login") || path.startsWith("/register")) {
          return true;
        }

        // API rotalarına token kontrolü
        if (path.startsWith("/api")) {
          return !!token;
        }

        // Diğer tüm sayfalar için oturum kontrolü
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Middleware'in çalışacağı yolları belirt
export const config = {
  matcher: [
    /*
     * Auth sayfaları ve public dosyalar hariç tüm yollar:
     * - /login
     * - /register
     * - /_next
     * - /api (API rotaları)
     * - /static (Statik dosyalar)
     */
    "/((?!login|register|_next|static|.*\\..*|api/auth).*)",
  ],
}; 