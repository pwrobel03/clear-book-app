"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SPRING_API } from "@/lib/server/spring"
import { callApi, callApiVoid } from "@/lib/server/api-action"
import type { AccountStatus, ActionResult, AuthResponse, UserRole, VoidResult } from "@/types/api"

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function setAuthCookie(token: string) {
  const store = await cookies()
  store.set("clearbook_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24h
    path: "/",
  })
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function loginAction(
  email: string, 
  password: string
): Promise<ActionResult<{ role: UserRole; status: AccountStatus }>> {
  const result = await callApi<AuthResponse>(
    () =>
      fetch(`${SPRING_API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }),
    "Invalid credentials."
  )

  if (result.error || !result.data) return result

  if (result.data.token) await setAuthCookie(result.data.token)

  return { data: { role: result.data.role, status: result.data.status } }
}

export async function registerAction(payload: {
  email: string
  password: string
  firstName: string
  lastName: string
  role: string
}): Promise<ActionResult<{ role: UserRole; status: AccountStatus }>> {
  const result = await callApi<AuthResponse>(
    () =>
      fetch(`${SPRING_API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    "Registration failed."
  )

  if (result.error || !result.data) return result

  if (result.data.token) await setAuthCookie(result.data.token)

  return { data: { role: result.data.role, status: result.data.status } }
}

export async function forgotPasswordAction(email: string): Promise<VoidResult> {
  return callApiVoid(
    () =>
      fetch(`${SPRING_API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }),
    "Failed to send the reset link. Please try again later."
  )
}

export async function resetPasswordAction(
  token: string,
  newPassword: string
): Promise<VoidResult> {
  return callApiVoid(
    () =>
      fetch(`${SPRING_API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      }),
    "Failed to reset the password. Please try again later."
  )
}

export async function verifyEmailAction(token: string): Promise<VoidResult> {
  return callApiVoid(
    () =>
      fetch(`${SPRING_API}/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
        method: "GET",
      }),
    "Email verification failed. The link may have expired."
  )
}

export async function logoutAction() {
  const store = await cookies()
  store.delete("clearbook_token")
  redirect("/auth")
}
