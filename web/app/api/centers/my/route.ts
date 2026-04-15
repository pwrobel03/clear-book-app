import { springFetch, proxyResponse, requireAuth } from "@/lib/server/spring";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  return proxyResponse(await springFetch("/api/centers/my"));
}
