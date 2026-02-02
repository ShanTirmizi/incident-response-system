import { PolicyAnalysis } from "@/types";
import { AnalysisSection } from "@/components/AnalysisSection";
import { InfoIcon } from "@/components/Icons";

interface PolicyAnalysisTabProps {
  analysis: PolicyAnalysis;
  sourceQuotes: Record<string, string>;
  isActive: boolean;
}

export function PolicyAnalysisTab({
  analysis,
  sourceQuotes,
  isActive,
}: PolicyAnalysisTabProps) {
  return (
    <div
      id="panel-analysis"
      role="tabpanel"
      aria-labelledby="tab-analysis"
      className={`space-y-6 ${isActive ? "block" : "hidden"}`}
      tabIndex={isActive ? 0 : -1}
    >
      <AnalysisSection
        title="Relevant Policies"
        items={analysis.relevant_policies}
        color="purple"
      />
      <AnalysisSection
        title="Policy Compliance"
        items={analysis.policy_compliance}
        color="green"
      />
      {analysis.concerns.length > 0 && (
        <AnalysisSection
          title="Concerns"
          items={analysis.concerns}
          color="red"
        />
      )}
      <AnalysisSection
        title="Recommended Actions"
        items={analysis.recommended_actions}
        color="amber"
      />

      {Object.keys(sourceQuotes).length > 0 && (
        <div
          className="glass-amber rounded-xl p-5 sm:p-6"
          role="region"
          aria-labelledby="source-quotes-title"
        >
          <h5
            id="source-quotes-title"
            className="font-semibold text-amber-800 mb-3 flex items-center gap-2"
          >
            <InfoIcon className="w-5 h-5" aria-hidden="true" />
            Source Quotes (for fact-checking)
          </h5>
          <div className="space-y-2">
            {Object.entries(sourceQuotes).map(([key, value]) => (
              <p key={key} className="text-sm text-amber-900">
                <span className="font-medium capitalize">
                  {key.replace(/_/g, " ")}:
                </span>{" "}
                <span className="italic">&quot;{value}&quot;</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
