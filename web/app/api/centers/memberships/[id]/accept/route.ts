import { NextRequest } from "next/server";
import { springFetch, proxyResponse, requireAuth } from "@/lib/server/spring";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  return proxyResponse(
    await springFetch(`/api/centers/memberships/${id}/accept`, { method: "POST" })
  );
}
