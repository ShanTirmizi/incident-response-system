import { CheckIcon, XIcon } from "./Icons";

interface FormFieldProps {
  label: string;
  value: string;
  multiline?: boolean;
}

/**
 * Display field for form data with label
 */
export function FormField({ label, value, multiline }: FormFieldProps) {
  return (
    <div className="group">
      <label className="block text-sm font-medium text-gray-500 mb-1.5">
        {label}
      </label>
      <div
        className={`p-3 glass-field rounded-lg text-gray-900 ${multiline ? 'min-h-[80px]' : 'min-h-[44px]'}`}
        aria-label={`${label}: ${value || 'Not specified'}`}
      >
        {value || <span className="text-gray-400">Not specified</span>}
      </div>
    </div>
  );
}

interface BooleanFieldProps {
  label: string;
  value: boolean;
}

/**
 * Display field for boolean values with Yes/No indicator
 */
export function BooleanField({ label, value }: BooleanFieldProps) {
  return (
    <div className="group">
      <label className="block text-sm font-medium text-gray-500 mb-1.5">
        {label}
      </label>
      <div
        className={`p-3 rounded-lg flex items-center gap-2 ${value ? 'glass-green text-green-800' : 'glass-field text-gray-600'}`}
        aria-label={`${label}: ${value ? 'Yes' : 'No'}`}
      >
        {value ? (
          <CheckIcon className="w-5 h-5 text-green-600" aria-hidden="true" />
        ) : (
          <XIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
        )}
        {value ? "Yes" : "No"}
      </div>
    </div>
  );
}
