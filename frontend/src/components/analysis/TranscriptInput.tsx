"use client";

import { SAMPLE_TRANSCRIPT } from "@/lib/sampleData";
import { TRANSCRIPT_MIN_LENGTH, TRANSCRIPT_MAX_LENGTH } from "@/lib/constants";
import {
  DocumentIcon,
  ArrowRightIcon,
  CheckIcon,
  SpinnerIcon,
} from "@/components/Icons";

interface TranscriptInputProps {
  transcript: string;
  onTranscriptChange: (value: string) => void;
  onAnalyze: () => void;
  loading: boolean;
}

export function TranscriptInput({
  transcript,
  onTranscriptChange,
  onAnalyze,
  loading,
}: TranscriptInputProps) {
  const trimmedLength = transcript.trim().length;
  const isValidLength = trimmedLength >= TRANSCRIPT_MIN_LENGTH;
  const charsNeeded = TRANSCRIPT_MIN_LENGTH - trimmedLength;

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Call/Meeting Transcript
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Paste your transcript below for AI analysis
          </p>
        </div>
        <button
          onClick={() => onTranscriptChange(SAMPLE_TRANSCRIPT)}
          className="text-sm text-emma-purple hover:text-emma-purple-dark font-medium flex items-center gap-1.5 transition-all hover:gap-2 self-start sm:self-auto focus:outline-none focus:ring-2 focus:ring-emma-purple focus:ring-offset-2 rounded-lg px-2 py-1"
          aria-label="Load sample transcript"
        >
          <DocumentIcon className="w-4 h-4" aria-hidden="true" />
          Load Sample
        </button>
      </div>

      <label htmlFor="transcript-input" className="sr-only">
        Enter your transcript
      </label>
      <textarea
        id="transcript-input"
        value={transcript}
        onChange={(e) => onTranscriptChange(e.target.value)}
        placeholder="Paste the call or meeting transcript here..."
        className="w-full h-56 sm:h-64 p-4 rounded-xl glass-input text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-emma-purple focus:ring-offset-2"
        aria-describedby="transcript-status"
        maxLength={TRANSCRIPT_MAX_LENGTH}
      />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-5 sm:mt-6">
        <div id="transcript-status" className="text-sm" aria-live="polite">
          {transcript.length > 0 && !isValidLength ? (
            <p className="text-amber-600" role="alert">
              {charsNeeded} more character{charsNeeded !== 1 ? "s" : ""} needed
            </p>
          ) : transcript.length > 0 ? (
            <p className="text-green-600 flex items-center gap-1">
              <CheckIcon className="w-4 h-4" aria-hidden="true" />
              Ready to analyze
            </p>
          ) : (
            <p className="text-gray-400">Minimum {TRANSCRIPT_MIN_LENGTH} characters required</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {transcript.length.toLocaleString()} / {TRANSCRIPT_MAX_LENGTH.toLocaleString()} characters
          </p>
        </div>

        <button
          onClick={onAnalyze}
          disabled={loading || !isValidLength}
          className="w-full sm:w-auto px-8 py-3 bg-emma-purple text-white font-medium rounded-full hover:bg-emma-purple-dark hover:shadow-lg hover:shadow-emma-purple/25 disabled:bg-emma-purple/40 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 group focus:outline-none focus:ring-2 focus:ring-emma-purple focus:ring-offset-2"
          aria-busy={loading}
        >
          {loading ? (
            <>
              <SpinnerIcon className="w-5 h-5" aria-hidden="true" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <span>Analyze Transcript</span>
              <ArrowRightIcon
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
