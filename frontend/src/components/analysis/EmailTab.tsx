"use client";

import { useCallback, useState } from "react";
import { DraftEmail } from "@/types";
import { CopyIcon, CheckIcon } from "@/components/Icons";

interface EmailTabProps {
  email: DraftEmail;
  isActive: boolean;
  onCopyResult: (success: boolean, field: string) => void;
}

type CopyState = "idle" | "copied";

interface CopyButtonProps {
  label: string;
  value: string;
  fieldName: string;
  onCopyResult: (success: boolean, field: string) => void;
}

function CopyButton({ label, value, fieldName, onCopyResult }: CopyButtonProps) {
  const [state, setState] = useState<CopyState>("idle");

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
      onCopyResult(true, fieldName);
      setTimeout(() => setState("idle"), 2000);
    } catch {
      onCopyResult(false, fieldName);
    }
  }, [value, fieldName, onCopyResult]);

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 text-gray-400 hover:text-emma-purple hover:bg-emma-purple-light rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-emma-purple focus:ring-offset-1"
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
    >
      {state === "copied" ? (
        <CheckIcon className="w-4 h-4 text-green-500" aria-hidden="true" />
      ) : (
        <CopyIcon className="w-4 h-4" aria-hidden="true" />
      )}
    </button>
  );
}

export function EmailTab({ email, isActive, onCopyResult }: EmailTabProps) {
  const toStr = email.to.join(", ");
  const ccStr = email.cc?.join(", ") || "";

  return (
    <div
      id="panel-email"
      role="tabpanel"
      aria-labelledby="tab-email"
      className={`space-y-6 ${isActive ? "block" : "hidden"}`}
      tabIndex={isActive ? 0 : -1}
    >
      <div className="glass-field rounded-xl p-5 sm:p-6">
        <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
          {/* To field */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm flex-1">
              <span className="font-medium text-gray-500 w-16 inline-block">
                To:
              </span>{" "}
              <span className="text-gray-900">{toStr}</span>
            </p>
            <CopyButton
              label="recipients"
              value={toStr}
              fieldName="To"
              onCopyResult={onCopyResult}
            />
          </div>

          {/* CC field */}
          {email.cc && email.cc.length > 0 && (
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm flex-1">
                <span className="font-medium text-gray-500 w-16 inline-block">
                  CC:
                </span>{" "}
                <span className="text-gray-900">{ccStr}</span>
              </p>
              <CopyButton
                label="CC recipients"
                value={ccStr}
                fieldName="CC"
                onCopyResult={onCopyResult}
              />
            </div>
          )}

          {/* Subject field */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm flex-1">
              <span className="font-medium text-gray-500 w-16 inline-block">
                Subject:
              </span>{" "}
              <span className="text-gray-900 font-medium">{email.subject}</span>
            </p>
            <CopyButton
              label="subject"
              value={email.subject}
              fieldName="Subject"
              onCopyResult={onCopyResult}
            />
          </div>
        </div>

        {/* Body */}
        <div className="relative">
          <div className="absolute top-2 right-2">
            <CopyButton
              label="email body"
              value={email.body}
              fieldName="Body"
              onCopyResult={onCopyResult}
            />
          </div>
          <div className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed pr-10">
            {email.body}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Click the copy icons to copy individual fields, then paste into your email client.
      </p>
    </div>
  );
}
