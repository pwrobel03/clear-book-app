import type { ActionResult, SpringPage, NormalizedSpringPage, VoidResult } from "@/types/api"

const FALLBACK_ERROR = "Service unavailable. Please try again later."

export function normalizeSpringPage<T>(
  raw: SpringPage<T>,
  fallbackPage = 0,
  fallbackSize = 20,
): NormalizedSpringPage<T> {
  // Spring Data ≥ 3.3 puts metadata under raw.page; older format is flat.
  const meta = raw.page ?? raw
  return {
    content: raw.content ?? [],
    totalElements: meta.totalElements ?? 0,
    totalPages: meta.totalPages ?? 0,
    size: meta.size ?? fallbackSize,
    number: meta.number ?? fallbackPage,
  }
}

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
