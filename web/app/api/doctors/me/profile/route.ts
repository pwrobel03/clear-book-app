import { NextRequest, NextResponse } from "next/server";
import { springFetch, proxyResponse, requireAuth } from "@/lib/server/spring";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  return proxyResponse(await springFetch("/api/doctors/me/profile"));
}

export async function PUT(request: NextRequest) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const body = await request.json();
  return proxyResponse(
    await springFetch("/api/doctors/me/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    })
  );
}
