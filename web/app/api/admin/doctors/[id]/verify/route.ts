import { NextRequest } from "next/server";
import { springFetch, proxyResponse, requireAuth } from "@/lib/server/spring";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  const body = await request.json();
  return proxyResponse(
    await springFetch(`/api/admin/doctors/${id}/verify`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
  );
}
