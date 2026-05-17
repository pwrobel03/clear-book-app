import { cookies, headers } from "next/headers";
import type { SessionUser } from "@/types/session";
import { SPRING_API } from "@/lib/server/spring";

/**
 * Server-only utility — fetches the current user's profile from Spring.
 *
 * Token resolution order:
 * 1. `x-access-token` header — injected by middleware after a proactive refresh.
 *    This ensures we use the freshly issued token even within the same render cycle
 *    before the updated cookie is visible to the Server Component.
 * 2. `clearbook_token` cookie — normal path when token is still valid.
 *
 * Returns null if unauthenticated or the backend is unreachable (the dashboard
 * layout handles the redirect to /auth in that case).
 */
export async function getServerSession(): Promise<SessionUser | null> {
  try {
    const headerStore = await headers();
    const cookieStore = await cookies();

    const token =
      headerStore.get("x-access-token") ??
      cookieStore.get("clearbook_token")?.value;

    if (!token) return null;

    const res = await fetch(`${SPRING_API}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) return null;
    return res.json() as Promise<SessionUser>;
  } catch {
    return null;
  }
}
