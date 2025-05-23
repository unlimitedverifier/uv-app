import { redirect } from "next/navigation";

/**
 * Redirects to a specified path with an error code
 * @param {string} path - The path to redirect to.
 * @param {string} code - The error code.
 * @param {string} message - Optional message to include in the redirect.
 * @param {Record<string, string>} additionalParams - Optional additional query parameters to include in the redirect.
 */
export function encodedRedirect(path: string, code: string, message?: string, additionalParams?: Record<string, string>) {
  const params = new URLSearchParams();
  params.set('code', code);
  if (message) params.set('message', message);
  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      params.set(key, value);
    });
  }
  return redirect(`${path}?${params.toString()}`);
}
