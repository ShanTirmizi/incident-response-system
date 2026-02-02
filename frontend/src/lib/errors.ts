/**
 * Centralized error handling utilities
 */
import { ApiError, TimeoutError } from "./api";

/**
 * Format an error into a user-friendly message
 */
export function formatErrorMessage(error: unknown): string {
  // Handle timeout errors
  if (error instanceof TimeoutError) {
    return "Request timed out. The server may be busy - please try again.";
  }

  // Handle API errors with detailed messages
  if (error instanceof ApiError) {
    if (error.details?.length) {
      return `${error.message}: ${error.details.join(", ")}`;
    }
    return error.message;
  }

  // Handle generic errors
  if (error instanceof Error) {
    return error.message;
  }

  // Fallback for unknown error types
  return "An unexpected error occurred";
}

/**
 * Check if error is an abort error (user cancelled)
 */
export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}
