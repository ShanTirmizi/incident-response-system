"""
Pydantic models for request/response validation
"""
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from enum import Enum


class SectionType(str, Enum):
    """Valid sections that can be edited via feedback"""
    INCIDENT_FORM = "incident_form"
    DRAFT_EMAIL = "draft_email"
    ALL = "all"


class TranscriptRequest(BaseModel):
    """Request model for submitting a transcript for analysis"""
    transcript: str = Field(
        ...,
        min_length=50,
        max_length=50000,
        description="The transcript text to analyze"
    )
    additional_context: Optional[str] = Field(
        default=None,
        max_length=5000,
        description="Optional additional context"
    )

    @field_validator('transcript')
    @classmethod
    def transcript_not_empty(cls, v: str) -> str:
        """Ensure transcript contains meaningful content"""
        if not v.strip():
            raise ValueError('Transcript cannot be empty or whitespace only')
        return v.strip()


class IncidentForm(BaseModel):
    """Generated incident report form"""
    date_and_time_of_incident: str = Field(..., description="When the incident occurred")
    service_user_name: str = Field(..., min_length=1, description="Name of service user")
    location_of_incident: str = Field(..., min_length=1, description="Where incident occurred")
    type_of_incident: str = Field(..., min_length=1, description="Category of incident")
    description_of_incident: str = Field(..., min_length=10, description="Detailed description")
    immediate_actions_taken: str = Field(..., min_length=1, description="Actions taken immediately")
    was_first_aid_administered: bool = Field(..., description="Whether first aid was given")
    were_emergency_services_contacted: bool = Field(..., description="Whether 999/GP was called")
    who_was_notified: str = Field(..., min_length=1, description="People notified about incident")
    witnesses: str = Field(default="None", description="Witnesses to the incident")
    agreed_next_steps: str = Field(..., min_length=1, description="Agreed follow-up actions")
    risk_assessment_needed: bool = Field(..., description="Whether risk assessment required")
    if_yes_which_risk_assessment: str = Field(default="", description="Type of risk assessment")

    @field_validator('date_and_time_of_incident')
    @classmethod
    def validate_datetime_format(cls, v: str) -> str:
        """Validate ISO 8601 datetime format with time component"""
        try:
            # Require 'T' separator to ensure both date and time are present
            if 'T' not in v:
                raise ValueError('Must include time component')
            datetime.fromisoformat(v.replace('Z', '+00:00'))
            return v
        except (ValueError, AttributeError):
            raise ValueError('Must be ISO 8601 format (e.g., "2025-01-31T14:30:00")')


class PolicyAnalysis(BaseModel):
    """Analysis of the transcript against policies"""
    relevant_policies: list[str] = Field(default_factory=list)
    policy_compliance: list[str] = Field(default_factory=list)
    recommended_actions: list[str] = Field(default_factory=list)
    concerns: list[str] = Field(default_factory=list)

    @field_validator('relevant_policies', 'policy_compliance', 'recommended_actions', 'concerns', mode='before')
    @classmethod
    def validate_list_items(cls, v):
        """Strip whitespace and reject empty items in lists"""
        if v is None:
            return []
        if not isinstance(v, list):
            return v
        cleaned = []
        for item in v:
            if not isinstance(item, str):
                raise ValueError('List items must be strings')
            stripped = item.strip()
            if stripped:
                cleaned.append(stripped)
        return cleaned


class DraftEmail(BaseModel):
    """Draft email generated from the incident"""
    to: list[str] = Field(..., min_length=1, description="Email recipients")
    cc: Optional[list[str]] = Field(default=None, description="CC recipients")
    subject: str = Field(..., min_length=5, description="Email subject line")
    body: str = Field(..., min_length=20, description="Email body content")

    @field_validator('to', 'cc', mode='before')
    @classmethod
    def ensure_list(cls, v):
        """Ensure recipients are always a list with valid email strings"""
        if v is None:
            return None
        if isinstance(v, str):
            if not v.strip():
                raise ValueError('Email address cannot be empty')
            return [v.strip()]
        if isinstance(v, list):
            cleaned = []
            for item in v:
                if not isinstance(item, str) or not item.strip():
                    raise ValueError('Email addresses must be non-empty strings')
                cleaned.append(item.strip())
            return cleaned
        raise ValueError('Must be string or list of strings')


class AnalysisResponse(BaseModel):
    """Complete response from analyzing a transcript"""
    incident_form: IncidentForm
    policy_analysis: PolicyAnalysis
    draft_email: DraftEmail
    source_quotes: dict[str, str] = Field(
        default_factory=dict,
        description="Source quotes from transcript for fact-checking"
    )


class FeedbackRequest(BaseModel):
    """Request model for providing feedback on generated content"""
    original_response: AnalysisResponse
    feedback: str = Field(
        ...,
        min_length=5,
        max_length=2000,
        description="Feedback to refine the content"
    )
    section_to_edit: SectionType = Field(
        ...,
        description="Which section to edit"
    )

    @field_validator('feedback')
    @classmethod
    def feedback_not_empty(cls, v: str) -> str:
        """Ensure feedback contains meaningful content"""
        if not v.strip():
            raise ValueError('Feedback cannot be empty or whitespace only')
        return v.strip()


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: str
    version: str = "1.0.0"
