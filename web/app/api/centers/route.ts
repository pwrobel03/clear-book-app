import { NextRequest } from "next/server";
import { springFetch, proxyResponse, requireAuth } from "@/lib/server/spring";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") ?? "";
  const page = searchParams.get("page") ?? "0";
  const size = searchParams.get("size") ?? "20";

  const query = new URLSearchParams({ page, size, ...(city ? { city } : {}) });
  return proxyResponse(await springFetch(`/api/centers?${query}`));
}

export async function POST(request: NextRequest) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const body = await request.json();
  return proxyResponse(
    await springFetch("/api/centers", { method: "POST", body: JSON.stringify(body) })
  );
}
