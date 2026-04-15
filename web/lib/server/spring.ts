import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const SPRING_API = process.env.SPRING_API_URL || "http://localhost:8080";

/** Forwards a request to the Spring backend, injecting the httpOnly JWT cookie. */
export async function springFetch(path: string, init?: RequestInit) {
  const store = await cookies();
  const token = store.get("clearbook_token")?.value;

  return fetch(`${SPRING_API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
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
