/**
 * Shared fetch utility for Geunnal pages.
 * - Automatically adds Authorization header
 * - Handles 401 (session expired) globally
 */

export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired')
    this.name = 'SessionExpiredError'
  }
}

export async function geunnalFetch(
  url: string,
  options: RequestInit & { token: string; pageId: string },
  onSessionExpired?: () => void
): Promise<Response> {
  const { token, pageId, headers: extraHeaders, ...rest } = options

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    ...(extraHeaders instanceof Headers
      ? Object.fromEntries(extraHeaders.entries())
      : Array.isArray(extraHeaders)
        ? Object.fromEntries(extraHeaders)
        : (extraHeaders as Record<string, string>) || {}),
  }

  const response = await fetch(url, { ...rest, headers })

  if (response.status === 401) {
    localStorage.removeItem(`geunnal-token-${pageId}`)
    onSessionExpired?.()
    throw new SessionExpiredError()
  }

  return response
}
