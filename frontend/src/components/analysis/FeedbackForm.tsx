"use client";

import { SectionType } from "@/types";
import { SpinnerIcon } from "@/components/Icons";
import { FEEDBACK_MIN_LENGTH, FEEDBACK_MAX_LENGTH } from "@/lib/constants";

interface FeedbackFormProps {
  feedback: string;
  onFeedbackChange: (value: string) => void;
  feedbackSection: SectionType;
  onSectionChange: (section: SectionType) => void;
  onSubmit: () => void;
  refining: boolean;
}

const SECTION_OPTIONS: { value: SectionType; label: string }[] = [
  { value: "all", label: "All Sections" },
  { value: "incident_form", label: "Incident Form" },
  { value: "draft_email", label: "Email" },
];

export function FeedbackForm({
  feedback,
  onFeedbackChange,
  feedbackSection,
  onSectionChange,
  onSubmit,
  refining,
}: FeedbackFormProps) {
  const trimmedLength = feedback.trim().length;
  const isValidLength = trimmedLength >= FEEDBACK_MIN_LENGTH;
  const charsNeeded = FEEDBACK_MIN_LENGTH - trimmedLength;

  return (
    <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-100">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">
        Refine with Feedback
      </h4>
      <div className="space-y-4">
        <fieldset>
          <legend className="sr-only">Select section to refine</legend>
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label="Section to refine"
          >
            {SECTION_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onSectionChange(option.value)}
                role="radio"
                aria-checked={feedbackSection === option.value}
                className={`px-4 py-2 text-sm rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emma-purple focus:ring-offset-2 ${
                  feedbackSection === option.value
                    ? "glass-button-purple text-white"
                    : "glass-button text-gray-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="feedback-input" className="sr-only">
            Enter your feedback
          </label>
          <textarea
            id="feedback-input"
            value={feedback}
            onChange={(e) => onFeedbackChange(e.target.value)}
            placeholder="Describe the changes you want (e.g., 'Change the service user name to John Smith' or 'Make the email more formal')..."
            className="w-full h-24 p-4 rounded-xl glass-input text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-emma-purple focus:ring-offset-2"
            minLength={FEEDBACK_MIN_LENGTH}
            maxLength={FEEDBACK_MAX_LENGTH}
            aria-describedby="feedback-status"
          />
          <div id="feedback-status" className="mt-2 flex justify-between text-sm" aria-live="polite">
            <div>
              {feedback.length > 0 && !isValidLength ? (
                <span className="text-amber-600" role="alert">
                  {charsNeeded} more character{charsNeeded !== 1 ? "s" : ""} needed
                </span>
              ) : feedback.length > 0 ? (
                <span className="text-green-600">Ready to submit</span>
              ) : (
                <span className="text-gray-400">Minimum {FEEDBACK_MIN_LENGTH} characters required</span>
              )}
            </div>
            <span className="text-gray-400">
              {feedback.length.toLocaleString()} / {FEEDBACK_MAX_LENGTH.toLocaleString()}
            </span>
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={refining || !isValidLength}
          className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-full hover:bg-green-700 hover:shadow-lg hover:shadow-green-600/25 disabled:bg-green-600/40 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
          aria-busy={refining}
        >
          {refining ? (
            <>
              <SpinnerIcon className="w-4 h-4" aria-hidden="true" />
              <span>Refining...</span>
            </>
          ) : (
            <span>Apply Feedback</span>
          )}
        </button>
      </div>
    </div>
  );
}
