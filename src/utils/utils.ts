import { redirect } from "next/navigation";

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * Useful for passing success or error messages between pages after form submissions.
 * @param type - The type of message, either 'error' or 'success'
 * @param path - The path to redirect to
 * @param message - The message to be encoded and added as a query parameter
 * @returns Never returns as it triggers a redirect
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string
): never {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}
