import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SPRING_API = "http://localhost:8080";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("clearbook_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(`${SPRING_API}/api/users/me/invite-code/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
