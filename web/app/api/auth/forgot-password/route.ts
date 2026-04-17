import { NextResponse } from "next/server";

const SPRING_API = "http://localhost:8080";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch(`${SPRING_API}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { message: data.message ?? "Wystąpił błąd podczas wysyłania linku." },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the server. Please try again later." },
      { status: 503 }
    );
  }
}