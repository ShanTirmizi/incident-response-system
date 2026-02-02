"use client";

import { useState, useCallback, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useAnalysis } from "@/hooks/useAnalysis";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DocumentIcon, ExclamationCircleIcon } from "@/components/Icons";
import { TranscriptInput, ResultsPanel } from "@/components/analysis";
import { SectionType } from "@/types";
import { TRANSCRIPT_MIN_LENGTH } from "@/lib/constants";

function HomePage() {
  const [transcript, setTranscript] = useState("");
  const [mounted, setMounted] = useState(false);

  const { result, loading, refining, error, analyze, refine } = useAnalysis();

  // Fade-in on mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!transcript.trim() || transcript.trim().length < TRANSCRIPT_MIN_LENGTH) return;
    await analyze(transcript);
  }, [transcript, analyze]);

  const handleRefine = useCallback(
    async (feedback: string, section: SectionType) => {
      if (!result) return false;
      const success = await refine(feedback, section);
      if (success) {
        toast.success("Content refined successfully");
      }
      return success;
    },
    [result, refine]
  );

  const handleCopyResult = useCallback((success: boolean, field: string) => {
    if (success) {
      toast.success(`${field} copied to clipboard`);
    } else {
      toast.error("Failed to copy - please select and copy manually");
    }
  }, []);

  return (
    <main
      className={`min-h-screen bg-white transition-opacity duration-500 ${
        mounted ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-emma-purple focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Toast Container */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1F2937",
            color: "#fff",
            borderRadius: "12px",
            minWidth: "280px",
          },
          success: {
            iconTheme: {
              primary: "#22C55E",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#EF4444",
              secondary: "#fff",
            },
          },
        }}
      />

      {/* Header */}
      <header className="border-b border-gray-100 animate-fade-in" role="banner">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-emma-purple">emma</span>
          </div>
          <span className="text-sm text-gray-600 hidden sm:block">
            Incident Response
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="bg-gradient-to-b from-emma-purple-lighter via-emma-purple-lighter/50 to-white py-12 sm:py-16 animate-fade-in"
        aria-labelledby="hero-title"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1
            id="hero-title"
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            <span className="text-emma-purple">Emma AI.</span> Incident Response.
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Process social care transcripts, analyze against policies, and
            generate comprehensive incident reports with the power of AI.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section
        id="main-content"
        className="py-8 sm:py-12"
        role="main"
        aria-label="Transcript analysis"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Transcript Input */}
          <TranscriptInput
            transcript={transcript}
            onTranscriptChange={setTranscript}
            onAnalyze={handleAnalyze}
            loading={loading}
          />

          {/* Loading State */}
          {loading && (
            <div
              className="glass-card-purple glass-shimmer rounded-2xl p-8 sm:p-12 mb-6 sm:mb-8 text-center"
              role="status"
              aria-live="polite"
            >
              <div
                className="w-16 h-16 border-4 border-emma-purple border-t-transparent rounded-full animate-spin mx-auto mb-6"
                aria-hidden="true"
              />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Analyzing Your Transcript
              </h3>
              <p className="text-gray-600">
                Our AI is processing the transcript, checking policies, and
                generating reports...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div
              className="glass-red rounded-2xl p-5 sm:p-6 mb-6 sm:mb-8 animate-shake"
              role="alert"
            >
              <div className="flex items-start gap-3">
                <ExclamationCircleIcon
                  className="w-6 h-6 text-red-500 flex-shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <h4 className="font-semibold text-red-800">Error</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <ResultsPanel
              result={result}
              onRefine={handleRefine}
              refining={refining}
              onCopyResult={handleCopyResult}
            />
          )}

          {/* Empty State */}
          {!result && !loading && !error && (
            <div className="relative glass-card-purple rounded-2xl p-8 sm:p-12 text-center overflow-hidden animate-slide-up">
              {/* Decorative Pattern */}
              <div className="absolute inset-0 opacity-30" aria-hidden="true">
                <svg className="w-full h-full" viewBox="0 0 400 300" fill="none">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#7C3AED"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.3"
                  />
                  <circle
                    cx="350"
                    cy="80"
                    r="60"
                    stroke="#7C3AED"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.2"
                  />
                  <circle
                    cx="100"
                    cy="250"
                    r="50"
                    stroke="#7C3AED"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.25"
                  />
                  <circle
                    cx="320"
                    cy="220"
                    r="30"
                    stroke="#7C3AED"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.3"
                  />
                  <path
                    d="M0 150 Q 100 100 200 150 T 400 150"
                    stroke="#7C3AED"
                    strokeWidth="1"
                    opacity="0.15"
                    fill="none"
                  />
                  <path
                    d="M0 180 Q 100 130 200 180 T 400 180"
                    stroke="#7C3AED"
                    strokeWidth="1"
                    opacity="0.1"
                    fill="none"
                  />
                </svg>
              </div>

              <div className="relative z-10">
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emma-purple/10 transition-transform hover:scale-105 hover:rotate-3">
                  <DocumentIcon
                    className="w-10 h-10 text-emma-purple"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ready to Analyze
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Paste a call or meeting transcript above and click
                  &quot;Analyze Transcript&quot; to generate an incident report,
                  draft email, and policy analysis.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t border-gray-100 py-6 sm:py-8 mt-8 sm:mt-12"
        role="contentinfo"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-gray-500">
            Powered by{" "}
            <span className="font-semibold text-emma-purple">Emma AI</span> |
            Care, Superintelligence.
          </p>
        </div>
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <ErrorBoundary>
      <HomePage />
    </ErrorBoundary>
  );
}
