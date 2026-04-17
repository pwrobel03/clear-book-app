import { NextResponse } from "next/server";

const SPRING_API = "http://localhost:8080";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const role = formData.get("role") as string;
    // Document file — backend will support this in a future stage
    // const document = formData.get("document") as File | null;

    const res = await fetch(`${SPRING_API}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, firstName, lastName, role }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { message: data.message ?? "Registration failed." },
        { status: res.status }
      );
    }

    const response = NextResponse.json({
      role: data.role,
      status: data.status,
      message: data.message ?? null,
    });

    // USER accounts are active immediately — set cookie
    // DOCTOR accounts are PENDING — no token returned by Spring
    if (data.token) {
      response.cookies.set("clearbook_token", data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
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
