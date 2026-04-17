import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("clearbook_token");
  return NextResponse.json({ success: true });
}
