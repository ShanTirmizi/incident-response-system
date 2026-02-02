/**
 * Custom hook for managing transcript analysis with request cancellation.
 *
 * Features:
 * - Automatic cancellation of in-flight requests when a new analysis starts
 * - Cleanup on component unmount
 * - Proper handling of AbortError (silent cancellation)
 * - State management for loading, error, and result
 */
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { analyzeTranscript, refineWithFeedback } from "@/lib/api";
import { formatErrorMessage, isAbortError } from "@/lib/errors";
import { AnalysisResponse, SectionType } from "@/types";

export interface UseAnalysisReturn {
  /** Current analysis result */
  result: AnalysisResponse | null;
  /** Whether an analysis is in progress */
  loading: boolean;
  /** Whether a refinement is in progress */
  refining: boolean;
  /** Current error message, if any */
  error: string | null;
  /** Analyze a transcript */
  analyze: (transcript: string, additionalContext?: string) => Promise<boolean>;
  /** Refine the current result with feedback. Returns true on success. */
  refine: (feedback: string, section: SectionType) => Promise<boolean>;
  /** Clear the current error */
  clearError: () => void;
}

export function useAnalysis(): UseAnalysisReturn {
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for abort controllers
  const analyzeAbortRef = useRef<AbortController | null>(null);
  const refineAbortRef = useRef<AbortController | null>(null);

  /**
   * Cancel any in-flight requests (internal use)
   */
  const cancelRequests = useCallback(() => {
    analyzeAbortRef.current?.abort();
    analyzeAbortRef.current = null;
    refineAbortRef.current?.abort();
    refineAbortRef.current = null;
  }, []);

  /**
   * Cleanup on unmount - cancel any pending requests
   */
  useEffect(() => {
    return () => {
      cancelRequests();
    };
  }, [cancelRequests]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Analyze a transcript
   * Returns true on success, false on failure
   */
  const analyze = useCallback(
    async (transcript: string, additionalContext?: string): Promise<boolean> => {
      // Cancel any in-flight analyze request
      analyzeAbortRef.current?.abort();
      analyzeAbortRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const response = await analyzeTranscript(
          transcript,
          additionalContext,
          analyzeAbortRef.current.signal
        );
        setResult(response);
        return true;
      } catch (err) {
        // Silently ignore abort errors - the request was cancelled intentionally
        if (isAbortError(err)) {
          return false;
        }
        setError(formatErrorMessage(err));
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Refine the current result with feedback
   * Returns true on success, false on failure
   */
  const refine = useCallback(
    async (feedback: string, section: SectionType): Promise<boolean> => {
      if (!result) {
        setError("No result to refine. Please analyze a transcript first.");
        return false;
      }

      // Cancel any in-flight refine request
      refineAbortRef.current?.abort();
      refineAbortRef.current = new AbortController();

      setRefining(true);
      setError(null);

      try {
        const response = await refineWithFeedback(
          result,
          feedback,
          section,
          refineAbortRef.current.signal
        );
        setResult(response);
        return true;
      } catch (err) {
        // Silently ignore abort errors
        if (isAbortError(err)) {
          return false;
        }
        setError(formatErrorMessage(err));
        return false;
      } finally {
        setRefining(false);
      }
    },
    [result]
  );

  return {
    result,
    loading,
    refining,
    error,
    analyze,
    refine,
    clearError,
  };
}
