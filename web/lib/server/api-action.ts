import type { ActionResult, VoidResult } from "@/types/api"

const FALLBACK_ERROR = "Service unavailable. Please try again later."

/**
 * Wraps a springFetch call for actions that return a JSON body on success.
 *
 * - 2xx → { data: T }
 * - 4xx with { message } body → { error: message }
 * - network error / unexpected → { error: fallbackError }
 */
export async function callApi<T>(
  fn: () => Promise<Response>,
  fallbackError = FALLBACK_ERROR
): Promise<ActionResult<T>> {
  try {
    const res = await fn()

    if (res.ok) {
      const data: T = await res.json()
      return { data }
    }

    const body = await res.json().catch(() => ({}))
    return { error: body?.message ?? fallbackError }
  } catch {
    return { error: fallbackError }
  }
}

/**
 * Wraps a springFetch call for actions that return no body on success (204).
 *
 * - 2xx → { success: true }
 * - 4xx with { message } body → { error: message }
 * - network error / unexpected → { error: fallbackError }
 */
export async function callApiVoid(
  fn: () => Promise<Response>,
  fallbackError = FALLBACK_ERROR
): Promise<VoidResult> {
  try {
    const res = await fn()

    if (res.ok) {
      return { success: true }
    }

    const body = await res.json().catch(() => ({}))
    return { error: body?.message ?? fallbackError }
  } catch {
    return { error: fallbackError }
  }
}
