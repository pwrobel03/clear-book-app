import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

// Używamy zmiennej środowiskowej (zabezpieczone fallbackiem)
export const SPRING_API = process.env.SPRING_API_URL || "http://localhost:8080";

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

  // if token expired or invalid, Spring will respond with 401.
  // Then we remove the cookie and redirect to login with callbackUrl to return after re-login.
  if (res.status === 401) {
    store.delete("clearbook_token");

    // Try to capture the current page URL so user can return after logging in
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