import { cookies } from "next/headers";
import type { SessionUser } from "@/types/session";
import { SPRING_API } from "@/lib/server/spring";

/**
 * Server-only utility — reads the httpOnly cookie and fetches
 * the current user's profile from the Spring backend.
 * Returns null if the user is not authenticated or the backend is unreachable.
 */
export async function getServerSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("clearbook_token")?.value;
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
