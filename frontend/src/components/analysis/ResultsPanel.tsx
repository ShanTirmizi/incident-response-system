"use client";

import { useState, useCallback } from "react";
import { AnalysisResponse, TabType, SectionType } from "@/types";
import { DocumentIcon, EnvelopeIcon, ClipboardIcon } from "@/components/Icons";
import { IncidentFormTab } from "./IncidentFormTab";
import { EmailTab } from "./EmailTab";
import { PolicyAnalysisTab } from "./PolicyAnalysisTab";
import { FeedbackForm } from "./FeedbackForm";
import { FEEDBACK_MIN_LENGTH } from "@/lib/constants";

interface ResultsPanelProps {
  result: AnalysisResponse;
  onRefine: (feedback: string, section: SectionType) => Promise<boolean>;
  refining: boolean;
  onCopyResult: (success: boolean, field: string) => void;
}

const TABS: { id: TabType; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "form", label: "Incident Form", Icon: DocumentIcon },
  { id: "email", label: "Draft Email", Icon: EnvelopeIcon },
  { id: "analysis", label: "Policy Analysis", Icon: ClipboardIcon },
];

export function ResultsPanel({
  result,
  onRefine,
  refining,
  onCopyResult,
}: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("form");
  const [feedback, setFeedback] = useState("");
  const [feedbackSection, setFeedbackSection] = useState<SectionType>("all");

  const handleRefine = useCallback(async () => {
    const trimmed = feedback.trim();
    if (trimmed.length < FEEDBACK_MIN_LENGTH) return;

    const success = await onRefine(trimmed, feedbackSection);
    if (success) {
      setFeedback("");
    }
  }, [feedback, feedbackSection, onRefine]);

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 animate-slide-up">
      {/* Tabs */}
      <div
        className="flex flex-wrap gap-2 mb-6 sm:mb-8 border-b border-gray-100 pb-4"
        role="tablist"
        aria-label="Result sections"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emma-purple focus:ring-offset-2 ${
              activeTab === tab.id
                ? "glass-button-purple text-white"
                : "glass-button text-gray-600 hover:text-gray-900"
            }`}
          >
            <tab.Icon className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <IncidentFormTab form={result.incident_form} isActive={activeTab === "form"} />
      <EmailTab
        email={result.draft_email}
        isActive={activeTab === "email"}
        onCopyResult={onCopyResult}
      />
      <PolicyAnalysisTab
        analysis={result.policy_analysis}
        sourceQuotes={result.source_quotes}
        isActive={activeTab === "analysis"}
      />

      {/* Feedback Section */}
      <FeedbackForm
        feedback={feedback}
        onFeedbackChange={setFeedback}
        feedbackSection={feedbackSection}
        onSectionChange={setFeedbackSection}
        onSubmit={handleRefine}
        refining={refining}
      />
    </div>
  );
}
