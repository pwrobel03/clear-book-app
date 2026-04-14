import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/auth", 
  "/api/auth/login", 
  "/api/auth/register", 
  "/api/auth/verify-email", // Proxy API jest publiczne
  "/colors"
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("clearbook_token")?.value;

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // Zalogowany użytkownik wchodzi na /auth -> odsyłamy do dashboardu, 
  if (token && pathname.startsWith("/auth") && !pathname.startsWith("/auth/email-verification")) {
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