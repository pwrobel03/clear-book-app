import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SPRING_API = "http://localhost:8080";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("clearbook_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const res = await fetch(`${SPRING_API}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Service unavailable" }, { status: 503 });
  }
}
