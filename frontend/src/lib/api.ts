/**
 * API client for the Incident Response System backend
 * Features: timeout, retry with exponential backoff, proper error handling
 */
import { AnalysisResponse, SectionType } from "@/types";
import {
  API_URL,
  DEFAULT_TIMEOUT_MS,
  MAX_RETRIES,
  INITIAL_RETRY_DELAY_MS,
  MAX_RETRY_DELAY_MS,
} from "./constants";

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: string[],
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Custom error class for timeout errors
 */
export class TimeoutError extends Error {
  constructor(message: string = "Request timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

/**
 * Sleep utility for retry backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate retry delay with exponential backoff and jitter
 * Aligned with backend: 2^n + random(0-1)
 */
function calculateRetryDelay(attempt: number): number {
  const exponentialDelay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
  const cappedDelay = Math.min(exponentialDelay, MAX_RETRY_DELAY_MS);
  // Add jitter: 0-1 second (aligned with backend)
  return cappedDelay + Math.random() * 1000;
}

/**
 * Parse Retry-After header value (supports both seconds and HTTP date formats)
 */
function parseRetryAfter(retryAfter: string | null, fallbackDelay: number): number {
  if (!retryAfter) return fallbackDelay;

  // Try parsing as seconds first
  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds)) {
    return Math.min(seconds * 1000, MAX_RETRY_DELAY_MS);
  }

  // Try parsing as HTTP date
  const retryDate = new Date(retryAfter).getTime();
  if (!isNaN(retryDate)) {
    const delay = Math.max(0, retryDate - Date.now());
    return Math.min(delay, MAX_RETRY_DELAY_MS);
  }

  return fallbackDelay;
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  // Network errors are retryable
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return true;
  }
  // Timeout errors are retryable
  if (error instanceof TimeoutError) {
    return true;
  }
  // 5xx errors are retryable
  if (error instanceof ApiError && error.status >= 500) {
    return true;
  }
  // Rate limit errors (429) are retryable
  if (error instanceof ApiError && error.status === 429) {
    return true;
  }
  return false;
}

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const userSignal = options.signal;
  if (userSignal) {
    userSignal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      if (userSignal?.aborted) {
        throw error;
      }
      throw new TimeoutError(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch with retry logic and exponential backoff with jitter
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);

      if (response.status >= 500 && attempt < maxRetries) {
        await response.text().catch(() => {});
        const delay = calculateRetryDelay(attempt);
        await sleep(delay);
        continue;
      }

      if (response.status === 429 && attempt < maxRetries) {
        await response.text().catch(() => {});
        const retryAfter = response.headers.get("Retry-After");
        const delay = parseRetryAfter(retryAfter, calculateRetryDelay(attempt));
        await sleep(delay);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;

      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }

      if (isRetryableError(error) && attempt < maxRetries) {
        const delay = calculateRetryDelay(attempt);
        await sleep(delay);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

/**
 * Handle API response and throw appropriate errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.detail || `Request failed: ${response.statusText}`,
      response.status,
      errorData.errors,
      response.status >= 500 || response.status === 429
    );
  }
  return response.json();
}

/**
 * Analyze a transcript against care policies
 */
export async function analyzeTranscript(
  transcript: string,
  additionalContext?: string,
  signal?: AbortSignal
): Promise<AnalysisResponse> {
  const response = await fetchWithRetry(`${API_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript: transcript.trim(),
      additional_context: additionalContext?.trim() || undefined,
    }),
    signal,
  });

  return handleResponse<AnalysisResponse>(response);
}

/**
 * Refine generated content based on user feedback
 */
export async function refineWithFeedback(
  originalResponse: AnalysisResponse,
  feedback: string,
  sectionToEdit: SectionType,
  signal?: AbortSignal
): Promise<AnalysisResponse> {
  const response = await fetchWithRetry(`${API_URL}/refine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      original_response: originalResponse,
      feedback: feedback.trim(),
      section_to_edit: sectionToEdit,
    }),
    signal,
  });

  return handleResponse<AnalysisResponse>(response);
}
