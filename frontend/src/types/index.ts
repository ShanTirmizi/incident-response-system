/**
 * Shared type definitions for the Incident Response System
 * These mirror the backend Pydantic models
 */

/**
 * Incident form data
 * Backend validators:
 * - date_and_time_of_incident: ISO 8601 format with time (e.g., "2025-01-31T14:30:00")
 * - service_user_name, location_of_incident, type_of_incident: min_length=1
 * - description_of_incident: min_length=10
 * - immediate_actions_taken, who_was_notified, agreed_next_steps: min_length=1
 */
export interface IncidentForm {
  date_and_time_of_incident: string;
  service_user_name: string;
  location_of_incident: string;
  type_of_incident: string;
  description_of_incident: string;
  immediate_actions_taken: string;
  was_first_aid_administered: boolean;
  were_emergency_services_contacted: boolean;
  who_was_notified: string;
  witnesses: string;
  agreed_next_steps: string;
  risk_assessment_needed: boolean;
  if_yes_which_risk_assessment: string;
}

/**
 * Policy analysis results
 * Backend validators:
 * - All list fields filter empty strings and strip whitespace
 */
export interface PolicyAnalysis {
  relevant_policies: string[];
  policy_compliance: string[];
  recommended_actions: string[];
  concerns: string[];
}

/**
 * Draft email data
 * Backend validators:
 * - to: list of non-empty strings, min_length=1
 * - cc: list of non-empty strings or null
 * - subject: min_length=5
 * - body: min_length=20
 */
export interface DraftEmail {
  to: string[];
  cc: string[] | null;
  subject: string;
  body: string;
}

export interface AnalysisResponse {
  incident_form: IncidentForm;
  policy_analysis: PolicyAnalysis;
  draft_email: DraftEmail;
  source_quotes: Record<string, string>;
}

export type SectionType = "incident_form" | "draft_email" | "all";

export type TabType = "form" | "email" | "analysis";
