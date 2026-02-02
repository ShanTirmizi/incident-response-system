/**
 * Shared constants for the Incident Response System frontend
 */

// API Configuration - aligned with backend
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const API_URL = `${API_BASE_URL}/v1`;

// Retry configuration - aligned with backend (backend: 2 retries, 30s total timeout)
export const MAX_RETRIES = 2;
export const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds total - matches backend max_total_timeout
export const INITIAL_RETRY_DELAY_MS = 1000;
export const MAX_RETRY_DELAY_MS = 10000; // Cap at 10 seconds to stay under total timeout

// Validation - aligned with backend validators
export const TRANSCRIPT_MIN_LENGTH = 50;
export const TRANSCRIPT_MAX_LENGTH = 50000;
export const FEEDBACK_MIN_LENGTH = 5;
export const FEEDBACK_MAX_LENGTH = 2000;
