import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

// Używamy zmiennej środowiskowej (zabezpieczone fallbackiem)
export const SPRING_API = process.env.SPRING_API_URL || "http://localhost:8080";

const COOKIE_MAX_AGE = parseInt(process.env.COOKIE_MAX_AGE || "604800", 10);
const ACCESS_TOKEN_MAX_AGE = COOKIE_MAX_AGE; 
const REFRESH_TOKEN_MAX_AGE = COOKIE_MAX_AGE;

/**
 * Parses the `Set-Cookie` header returned by Spring and extracts the `refreshToken` value.
 */
export function extractRefreshTokenFromSetCookie(res: Response): string | null {
  const raw = res.headers.get("set-cookie");
  if (!raw) return null;
  const match = raw.match(/(?:^|,\s*)refreshToken=([^;,\s]+)/i);
  return match?.[1] ?? null;
}

/**
 * Stores the Spring access token as a Next.js HttpOnly cookie.
 */
export async function setAccessTokenCookie(token: string) {
  const store = await cookies();
  store.set("clearbook_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: "/",
  });
}

/**
 * Stores the Spring refresh token value as a Next.js HttpOnly cookie.
 */
export async function setRefreshTokenCookie(token: string) {
  const store = await cookies();
  store.set("clearbook_refresh_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: "/",
  });
}

/**
 * Resolves the best available access token for the current request:
 * 1. `x-access-token` header — injected by middleware after a proactive refresh
 * 2. `clearbook_token` cookie — normal case (token still valid)
 */
async function resolveAccessToken(): Promise<string | undefined> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-access-token");
  if (forwarded) return forwarded;

  const store = await cookies();
  return store.get("clearbook_token")?.value;
}

/**
 * Forwards a request to the Spring backend, injecting the current access token.
 *
 * Token refresh is handled proactively by middleware before the request reaches
 * Server Components. This function only needs to handle the edge case where the
 * token expired mid-request (e.g. a slow Server Action).
 */
export async function springFetch(path: string, init?: RequestInit) {
  const token = await resolveAccessToken();

  const res = await fetch(`${SPRING_API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  // 401 here means the token expired mid-request after middleware already ran.
  // Clear session cookies and send the user to login.
  if (res.status === 401) {
    const store = await cookies();
    try { store.delete("clearbook_token"); } catch { /* Server Component context — ignore */ }
    try { store.delete("clearbook_refresh_token"); } catch { /* same */ }

    const headerStore = await headers();
    const referer = headerStore.get("referer");
    let callbackPath = "";
    if (referer) {
      try {
        callbackPath = new URL(referer).pathname;
      } catch { /* ignore invalid referer */ }
    }

    const params = new URLSearchParams({ expired: "true" });
    if (callbackPath && callbackPath !== "/auth") {
      params.set("callbackUrl", callbackPath);
    }
    redirect(`/auth?${params.toString()}`);
  }

  return res;
}

/** Proxies the Spring response directly to the client. */
export async function proxyResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

/** Returns 401 if not authenticated. */
export async function requireAuth() {
  const token = await resolveAccessToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return null;
}
