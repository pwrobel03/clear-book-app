import { NextResponse } from "next/server";

const SPRING_API = "http://localhost:8080";

export async function GET(request: Request) {
  try {
    // Wyciągamy token z URL zapytania przychodzącego
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { message: "Missing verification token." },
        { status: 400 }
      );
    }

    // Przekazujemy zapytanie do backendu Spring Boot
    const res = await fetch(`${SPRING_API}/api/auth/verify-email?token=${token}`, {
      method: "GET",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { message: data.message ?? "Verification failed." },
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