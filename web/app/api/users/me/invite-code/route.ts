import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SPRING_API = "http://localhost:8080";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("clearbook_token")?.value ?? null;
}

/** GET — returns current invite code (auto-generates if needed) */
export async function GET() {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${SPRING_API}/api/users/me/invite-code`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return NextResponse.json(await res.json(), { status: res.status });
}

/** POST — forces regeneration of invite code */
export async function POST() {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${SPRING_API}/api/users/me/invite-code/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
