import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/auth", 
  "/api/auth/login", 
  "/api/auth/register", 
  "/api/auth/verify-email", // Proxy API jest publiczne
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/colors",
  "/doctors",  // public doctor profiles + search results
  "/centers",  // public center listing + individual center pages
  "/",         // landing page
];

const AUTH_UI_EXCEPTIONS = [
  "/auth/email-verification",
  "/auth/reset-password"
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("clearbook_token")?.value;

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthUiException = AUTH_UI_EXCEPTIONS.some((r) => pathname.startsWith(r));

  // Zalogowany użytkownik wchodzi na /auth -> odsyłamy do dashboardu, chyba że to specjalny ekran
  if (token && pathname.startsWith("/auth") && !isAuthUiException) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Niezalogowany użytkownik wchodzi na chronioną stronę -> na logowanie
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};