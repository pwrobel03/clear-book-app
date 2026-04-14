import { NextResponse } from "next/server";

const SPRING_API = "http://localhost:8080";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch(`${SPRING_API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { message: data.message ?? "Invalid credentials." },
        { status: res.status }
      );
    }

    const response = NextResponse.json({
      role: data.role,
      status: data.status,
      message: data.message ?? null,
    });

    // Set httpOnly cookie — token never accessible from JS
    if (data.token) {
      response.cookies.set("clearbook_token", data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24h — matches Spring JWT expiry
        path: "/",
      });
    }

    return response;
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the server. Please try again later." },
      { status: 503 }
    );
  }
}
