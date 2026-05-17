import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SPRING_API = process.env.SPRING_API_URL || "http://localhost:8080";
const EXPIRATION_BUFFER_MS = parseInt(process.env.JWT_EXPIRATION_BUFFER_MS || "10000", 10);

const PUBLIC_ROUTES = [
  "/auth",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/verify-email",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/colors",
  "/doctors",
  "/centers",
  "/",
];

const AUTH_UI_EXCEPTIONS = [
  "/auth/email-verification",
  "/auth/reset-password"
];

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: parseInt(process.env.COOKIE_MAX_AGE || "604800", 10),
};

/**
 * Decode the JWT payload and check whether it has already expired.
 * We intentionally skip signature verification — that is Spring's job.
 * Here we only need to know if the token is stale so we can refresh proactively.
 */
function isJwtExpired(token: string): boolean {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    // Add expiration buffer so we refresh slightly before actual expiry
    return typeof payload.exp === "number" && payload.exp * 1000 < Date.now() + EXPIRATION_BUFFER_MS;
  } catch {
    return true;
  }
}

/**
 * Calls Spring /api/auth/refresh from the middleware (Edge-compatible).
 * Returns the new access token and optional rotated refresh token, or null on failure.
 */
async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; newRefreshToken?: string } | null> {
  try {
    const res = await fetch(`${SPRING_API}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refreshToken=${refreshToken}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.token) return null;

    // Extract the rotated refresh token from Spring's Set-Cookie header
    const setCookie = res.headers.get("set-cookie");
    const newRefreshToken = setCookie?.match(/(?:^|,\s*)refreshToken=([^;,\s]+)/i)?.[1];

    return { accessToken: data.token, newRefreshToken };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const cookieToken = request.cookies.get("clearbook_token")?.value;
  const refreshCookie = request.cookies.get("clearbook_refresh_token")?.value;

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthUiException = AUTH_UI_EXCEPTIONS.some((r) => pathname.startsWith(r));

  // ── Step 1: Determine effective access token ──────────────────────────────
  let activeToken = cookieToken;
  let refreshResult: { accessToken: string; newRefreshToken?: string } | null = null;

  if (cookieToken && isJwtExpired(cookieToken)) {
    activeToken = undefined; // expired — don't use it

    if (refreshCookie) {
      refreshResult = await refreshAccessToken(refreshCookie);
      if (refreshResult) {
        activeToken = refreshResult.accessToken;
      }
    }
  }

  // ── Step 2: Routing decisions ─────────────────────────────────────────────

  // Logged-in user hitting /auth → send to dashboard (skip special auth screens)
  if (activeToken && pathname.startsWith("/auth") && !isAuthUiException) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Unauthenticated user hitting a protected route → redirect to login
  if (!activeToken && !isPublic) {
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const response = NextResponse.redirect(loginUrl);
    // Clear stale / revoked cookies so they don't cause another loop
    response.cookies.delete("clearbook_token");
    response.cookies.delete("clearbook_refresh_token");
    return response;
  }

  // ── Step 3: If tokens were refreshed, propagate them ─────────────────────
  if (refreshResult) {
    // Inject the new access token into request headers so Server Components
    // can read it via headers() from next/headers in the same render cycle.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-access-token", refreshResult.accessToken);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    // Update browser cookies for subsequent requests
    response.cookies.set("clearbook_token", refreshResult.accessToken, COOKIE_BASE);
    if (refreshResult.newRefreshToken) {
      response.cookies.set(
        "clearbook_refresh_token",
        refreshResult.newRefreshToken,
        COOKIE_BASE
      );
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
