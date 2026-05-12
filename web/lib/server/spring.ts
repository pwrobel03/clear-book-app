import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

// Używamy zmiennej środowiskowej (zabezpieczone fallbackiem)
export const SPRING_API = process.env.SPRING_API_URL || "http://localhost:8080";

const ACCESS_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days — cookie outlives the JWT; Spring 401 triggers silent refresh
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days — matches Spring configuration

/**
 * Parses the `Set-Cookie` header returned by Spring and extracts the `refreshToken` value.
 * Spring may return multiple Set-Cookie headers; node-fetch / undici exposes them joined by ", ".
 */
export function extractRefreshTokenFromSetCookie(res: Response): string | null {
  // Headers API returns a single joined string for repeated header names
  const raw = res.headers.get("set-cookie");
  if (!raw) return null;
  // Match refreshToken=<value> (stops at ; or end)
  const match = raw.match(/(?:^|,\s*)refreshToken=([^;,\s]+)/i);
  return match?.[1] ?? null;
}

/**
 * Stores the Spring access token as a Next.js HttpOnly cookie.
 * Exported so auth.ts can reuse the same settings.
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
 * Stores the Spring refresh token value (extracted from Set-Cookie) as a Next.js HttpOnly cookie.
 * Exported so auth.ts can reuse the same settings on login.
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
 * Calls Spring /api/auth/refresh using the stored refresh token cookie.
 * On success: rotates both cookies and returns the new access token.
 * On failure: clears both cookies and returns null.
 */
async function tryRefreshTokens(): Promise<string | null> {
  const store = await cookies();
  const refreshToken = store.get("clearbook_refresh_token")?.value;
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${SPRING_API}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Pass the stored refresh token as a cookie header so Spring can read it
        Cookie: `refreshToken=${refreshToken}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      store.delete("clearbook_token");
      store.delete("clearbook_refresh_token");
      return null;
    }

    const data = await res.json();
    const newAccessToken: string | undefined = data.token;
    if (!newAccessToken) return null;

    await setAccessTokenCookie(newAccessToken);

    // Spring rotates the refresh token on every use — extract and persist the new one
    const newRefreshToken = extractRefreshTokenFromSetCookie(res);
    if (newRefreshToken) {
      await setRefreshTokenCookie(newRefreshToken);
    }

    return newAccessToken;
  } catch {
    return null;
  }
}

/** Forwards a request to the Spring backend, injecting the httpOnly JWT cookie. */
export async function springFetch(path: string, init?: RequestInit) {
  const store = await cookies();
  const token = store.get("clearbook_token")?.value;

  const res = await fetch(`${SPRING_API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  // Access token expired — attempt a silent refresh before giving up
  if (res.status === 401) {
    const newAccessToken = await tryRefreshTokens();

    if (newAccessToken) {
      // Retry the original request with the freshly issued access token
      return fetch(`${SPRING_API}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newAccessToken}`,
          ...(init?.headers ?? {}),
        },
        cache: "no-store",
      });
    }

    // Refresh failed (token revoked / expired) — clear session and redirect to login
    store.delete("clearbook_token");
    store.delete("clearbook_refresh_token");

    const headerStore = await headers();
    const referer = headerStore.get("referer");
    let callbackPath = "";
    if (referer) {
      try {
        const url = new URL(referer);
        callbackPath = url.pathname;
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
  const store = await cookies();
  const token = store.get("clearbook_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return null;
}