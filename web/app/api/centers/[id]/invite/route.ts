import { NextRequest } from "next/server";
import { springFetch, proxyResponse, requireAuth } from "@/lib/server/spring";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  const body = await request.json();
  return proxyResponse(
    await springFetch(`/api/centers/${id}/invite`, {
      method: "POST",
      body: JSON.stringify(body),
    })
  );
}
