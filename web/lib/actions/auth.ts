"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import {
  SPRING_API,
  extractRefreshTokenFromSetCookie,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "@/lib/server/spring"
import { callApiVoid } from "@/lib/server/api-action"
import type { AccountStatus, ActionResult, AuthResponse, UserRole, VoidResult } from "@/types/api"

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function loginAction(
  email: string,
  password: string
): Promise<ActionResult<{ role: UserRole; status: AccountStatus }>> {
  let res: Response
  try {
    res = await fetch(`${SPRING_API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    return { error: "Service unavailable. Please try again later." }
  }

  const body: AuthResponse = await res.json().catch(() => ({}))

  if (!res.ok) {
    return { error: body?.message ?? "Invalid credentials." }
  }

  // Store the short-lived access token
  if (body.token) {
    await setAccessTokenCookie(body.token)
  }

  // Extract and store the HttpOnly refresh token that Spring attached to Set-Cookie
  const refreshToken = extractRefreshTokenFromSetCookie(res)
  if (refreshToken) {
    await setRefreshTokenCookie(refreshToken)
  }

  return { data: { role: body.role, status: body.status } }
}

export async function registerAction(payload: {
  email: string
  password: string
  firstName: string
  lastName: string
  role: string
}): Promise<ActionResult<{ role: UserRole; status: AccountStatus }>> {
  let res: Response
  try {
    res = await fetch(`${SPRING_API}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  } catch {
    return { error: "Service unavailable. Please try again later." }
  }

  const body: AuthResponse = await res.json().catch(() => ({}))

  if (!res.ok) {
    return { error: body?.message ?? "Registration failed." }
  }

  // Registration for patients completes immediately; doctors go to PENDING — no tokens yet
  if (body.token) {
    await setAccessTokenCookie(body.token)
  }

  const refreshToken = extractRefreshTokenFromSetCookie(res)
  if (refreshToken) {
    await setRefreshTokenCookie(refreshToken)
  }

  return { data: { role: body.role, status: body.status } }
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
  const refreshToken = store.get("clearbook_refresh_token")?.value

  // Tell Spring to revoke the refresh token — fire and forget; errors don't block logout
  if (refreshToken) {
    try {
      await fetch(`${SPRING_API}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `refreshToken=${refreshToken}`,
        },
        cache: "no-store",
      })
    } catch { /* ignore network errors on logout */ }
  }

  store.delete("clearbook_token")
  store.delete("clearbook_refresh_token")
  redirect("/auth")
}
