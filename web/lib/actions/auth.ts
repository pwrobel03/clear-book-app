"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SPRING_API } from "@/lib/server/spring";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function setAuthCookie(token: string) {
  const store = await cookies();
  store.set("clearbook_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24h
    path: "/",
  });
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function loginAction(email: string, password: string) {
  try {
    const res = await fetch(`${SPRING_API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.message ?? "Invalid credentials." };
    }

    if (data.token) await setAuthCookie(data.token);

    return {
      role: data.role as string,
      status: data.status as string,
      message: (data.message as string) ?? null,
    };
  } catch {
    return { error: "Service unavailable. Please try again later." };
  }
}

export async function registerAction(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}) {
  try {
    const res = await fetch(`${SPRING_API}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.message ?? "Registration failed." };
    }

    if (data.token) await setAuthCookie(data.token);

    return {
      role: data.role as string,
      status: data.status as string,
      message: (data.message as string) ?? null,
    };
  } catch {
    return { error: "Service unavailable. Please try again later." };
  }
}

export async function forgotPasswordAction(email: string) {
  try {
    const res = await fetch(`${SPRING_API}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.message ?? "Wystąpił błąd podczas wysyłania linku." };
    return { success: true, message: data.message };
  } catch {
    return { error: "Unable to reach the server. Please try again later." };
  }
}

export async function resetPasswordAction(token: string, newPassword: string) {
  try {
    const res = await fetch(`${SPRING_API}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.message ?? "Wystąpił błąd podczas resetowania hasła." };
    return { success: true, message: data.message };
  } catch {
    return { error: "Unable to reach the server. Please try again later." };
  }
}

export async function verifyEmailAction(token: string) {
  try {
    const res = await fetch(`${SPRING_API}/api/auth/verify-email?token=${token}`, {
      method: "GET",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.message ?? "Verification failed." };
    return { success: true, message: data.message };
  } catch {
    return { error: "Unable to reach the server. Please try again later." };
  }
}

export async function logoutAction() {
  const store = await cookies();
  store.delete("clearbook_token");
  redirect("/auth");
}
