"""
Unit tests for the Incident Response System API

Run with: pytest test_api.py -v
"""
import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient

from main import app, get_ai_service
from models import (
    IncidentForm,
    PolicyAnalysis,
    DraftEmail,
    AnalysisResponse,
    SectionType
)
from ai_service import AIService, AIServiceError


# Test fixtures
@pytest.fixture
def sample_transcript():
    """Sample transcript for testing"""
    return """Julie Peaterson: "Good morning, Julie Peaterson speaking, how can I help you?"
Greg Jones: "Hi, it's Greg Jones. I've fallen again."
Julie Peaterson: "Oh no, Greg! Are you alright? Where are you right now?"
Greg Jones: "I'm in the living room, on the floor."
Julie Peaterson: "Are you hurt? Do you feel any pain?"
Greg Jones: "No blood, nothing's broken. But this is the third time this week."
Julie Peaterson: "That's concerning. Let me get you some help."
Greg Jones: "Thanks. I feel a bit confused, can't remember how I ended up here." """


@pytest.fixture
def sample_incident_form():
    """Sample incident form for testing"""
    return IncidentForm(
        date_and_time_of_incident="2024-01-15T10:30:00",
        service_user_name="Greg Jones",
        location_of_incident="Living room",
        type_of_incident="Fall",
        description_of_incident="Service user fell in living room, third fall this week.",
        immediate_actions_taken="Staff member contacted, help arranged",
        was_first_aid_administered=False,
        were_emergency_services_contacted=False,
        who_was_notified="Supervisor, Risk Assessor",
        witnesses="Julie Peaterson",
        agreed_next_steps="Risk assessment review",
        risk_assessment_needed=True,
        if_yes_which_risk_assessment="Moving and handling"
    )


@pytest.fixture
def sample_analysis_response(sample_incident_form):
    """Sample complete analysis response"""
    return AnalysisResponse(
        incident_form=sample_incident_form,
        policy_analysis=PolicyAnalysis(
            relevant_policies=["Section 3: Mobility & Moving"],
            policy_compliance=["Staff assessed physical state"],
            recommended_actions=["Email supervisor", "CC Risk Assessor"],
            concerns=["Recurring falls", "Confusion"]
        ),
        draft_email=DraftEmail(
            to=["supervisor@example.com"],
            cc=["riskassessor@example.com"],
            subject="Incident Report: Fall - Greg Jones",
            body="Dear Supervisor,\n\nThis is to notify you of an incident..."
        ),
        source_quotes={
            "name": "Greg Jones",
            "incident": "I've fallen again",
            "recurrence": "third time this week"
        }
    )


@pytest.fixture
def mock_ai_service(sample_analysis_response):
    """Mock AI service that returns sample data"""
    service = Mock(spec=AIService)
    service.analyze_transcript.return_value = sample_analysis_response
    service.refine_with_feedback.return_value = sample_analysis_response
    return service


@pytest.fixture
def client(mock_ai_service):
    """Test client with mocked AI service"""
    app.dependency_overrides[get_ai_service] = lambda: mock_ai_service
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


# Health endpoint tests
class TestHealthEndpoint:
    """Tests for /health endpoint"""

    def test_health_check_returns_200(self, client):
        """Health check should return 200 OK"""
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_check_returns_healthy_status(self, client):
        """Health check should return healthy status"""
        response = client.get("/health")
        data = response.json()
        assert data["status"] == "healthy"

    def test_health_check_includes_timestamp(self, client):
        """Health check should include timestamp"""
        response = client.get("/health")
        data = response.json()
        assert "timestamp" in data

    def test_health_check_includes_version(self, client):
        """Health check should include version"""
        response = client.get("/health")
        data = response.json()
        assert "version" in data


# Analyze endpoint tests
class TestAnalyzeEndpoint:
    """Tests for /v1/analyze endpoint"""

    def test_analyze_returns_200_with_valid_transcript(
        self, client, sample_transcript
    ):
        """Analyze should return 200 with valid transcript"""
        response = client.post(
            "/v1/analyze",
            json={"transcript": sample_transcript}
        )
        assert response.status_code == 200

    def test_analyze_returns_incident_form(self, client, sample_transcript):
        """Analyze should return incident form in response"""
        response = client.post(
            "/v1/analyze",
            json={"transcript": sample_transcript}
        )
        data = response.json()
        assert "incident_form" in data
        assert "service_user_name" in data["incident_form"]

    def test_analyze_returns_policy_analysis(self, client, sample_transcript):
        """Analyze should return policy analysis"""
        response = client.post(
            "/v1/analyze",
            json={"transcript": sample_transcript}
        )
        data = response.json()
        assert "policy_analysis" in data
        assert "relevant_policies" in data["policy_analysis"]

    def test_analyze_returns_draft_email(self, client, sample_transcript):
        """Analyze should return draft email"""
        response = client.post(
            "/v1/analyze",
            json={"transcript": sample_transcript}
        )
        data = response.json()
        assert "draft_email" in data
        assert "to" in data["draft_email"]
        assert "subject" in data["draft_email"]

    def test_analyze_returns_source_quotes(self, client, sample_transcript):
        """Analyze should return source quotes for fact-checking"""
        response = client.post(
            "/v1/analyze",
            json={"transcript": sample_transcript}
        )
        data = response.json()
        assert "source_quotes" in data

    def test_analyze_rejects_empty_transcript(self, client):
        """Analyze should reject empty transcript"""
        response = client.post(
            "/v1/analyze",
            json={"transcript": ""}
        )
        assert response.status_code == 422

    def test_analyze_rejects_short_transcript(self, client):
        """Analyze should reject transcript shorter than 50 chars"""
        response = client.post(
            "/v1/analyze",
            json={"transcript": "Too short"}
        )
        assert response.status_code == 422

    def test_analyze_accepts_additional_context(
        self, client, sample_transcript, mock_ai_service
    ):
        """Analyze should accept optional additional context"""
        response = client.post(
            "/v1/analyze",
            json={
                "transcript": sample_transcript,
                "additional_context": "Patient has history of falls"
            }
        )
        assert response.status_code == 200
        # Verify context was passed to service
        mock_ai_service.analyze_transcript.assert_called_once()
        call_args = mock_ai_service.analyze_transcript.call_args
        assert call_args.kwargs["additional_context"] == "Patient has history of falls"


# Refine endpoint tests
class TestRefineEndpoint:
    """Tests for /v1/refine endpoint"""

    def test_refine_returns_200_with_valid_request(
        self, client, sample_analysis_response
    ):
        """Refine should return 200 with valid request"""
        response = client.post(
            "/v1/refine",
            json={
                "original_response": sample_analysis_response.model_dump(),
                "feedback": "Change the recipient to manager@example.com",
                "section_to_edit": "draft_email"
            }
        )
        assert response.status_code == 200

    def test_refine_accepts_incident_form_section(
        self, client, sample_analysis_response
    ):
        """Refine should accept incident_form section"""
        response = client.post(
            "/v1/refine",
            json={
                "original_response": sample_analysis_response.model_dump(),
                "feedback": "Update the location to kitchen",
                "section_to_edit": "incident_form"
            }
        )
        assert response.status_code == 200

    def test_refine_accepts_all_section(self, client, sample_analysis_response):
        """Refine should accept 'all' section"""
        response = client.post(
            "/v1/refine",
            json={
                "original_response": sample_analysis_response.model_dump(),
                "feedback": "Make everything more formal",
                "section_to_edit": "all"
            }
        )
        assert response.status_code == 200

    def test_refine_rejects_invalid_section(self, client, sample_analysis_response):
        """Refine should reject invalid section"""
        response = client.post(
            "/v1/refine",
            json={
                "original_response": sample_analysis_response.model_dump(),
                "feedback": "Some feedback",
                "section_to_edit": "invalid_section"
            }
        )
        assert response.status_code == 422

    def test_refine_rejects_empty_feedback(self, client, sample_analysis_response):
        """Refine should reject empty feedback"""
        response = client.post(
            "/v1/refine",
            json={
                "original_response": sample_analysis_response.model_dump(),
                "feedback": "",
                "section_to_edit": "all"
            }
        )
        assert response.status_code == 422

    def test_refine_rejects_short_feedback(self, client, sample_analysis_response):
        """Refine should reject feedback shorter than 5 chars"""
        response = client.post(
            "/v1/refine",
            json={
                "original_response": sample_analysis_response.model_dump(),
                "feedback": "Hi",
                "section_to_edit": "all"
            }
        )
        assert response.status_code == 422


# Policies endpoint tests
class TestPoliciesEndpoint:
    """Tests for /v1/policies endpoint"""

    def test_policies_returns_200(self, client):
        """Policies endpoint should return 200"""
        response = client.get("/v1/policies")
        assert response.status_code == 200

    def test_policies_returns_document(self, client):
        """Policies endpoint should return policies document"""
        response = client.get("/v1/policies")
        data = response.json()
        assert "policies" in data
        assert "Medication Administration" in data["policies"]


# Form template endpoint tests
class TestFormTemplateEndpoint:
    """Tests for /v1/form-template endpoint"""

    def test_form_template_returns_200(self, client):
        """Form template endpoint should return 200"""
        response = client.get("/v1/form-template")
        assert response.status_code == 200

    def test_form_template_returns_template(self, client):
        """Form template endpoint should return template"""
        response = client.get("/v1/form-template")
        data = response.json()
        assert "template" in data
        assert "date_and_time_of_incident" in data["template"]


# AI Service unit tests
class TestAIService:
    """Unit tests for AIService class"""

    def test_ai_service_initializes_with_api_key(self):
        """AI service should initialize with API key"""
        with patch('ai_service.AsyncOpenAI') as mock_openai:
            service = AIService(api_key="test-key")
            mock_openai.assert_called_once()
            assert service.model == "gpt-4o"

    def test_ai_service_uses_custom_model(self):
        """AI service should use custom model if provided"""
        with patch('ai_service.AsyncOpenAI'):
            service = AIService(api_key="test-key", model="gpt-4-turbo")
            assert service.model == "gpt-4-turbo"

    def test_ai_service_default_retry_count(self):
        """AI service should default to 2 retries"""
        with patch('ai_service.AsyncOpenAI'):
            service = AIService(api_key="test-key")
            assert service.max_retries == 2

    def test_ai_service_default_total_timeout(self):
        """AI service should default to 30s total timeout"""
        with patch('ai_service.AsyncOpenAI'):
            service = AIService(api_key="test-key")
            assert service.max_total_timeout == 30

    def test_ai_service_parse_json_handles_valid_json(self):
        """AI service should parse valid JSON"""
        with patch('ai_service.AsyncOpenAI'):
            service = AIService(api_key="test-key")
            result = service._parse_json_response('{"key": "value"}', "test")
            assert result == {"key": "value"}

    def test_ai_service_parse_json_raises_on_invalid(self):
        """AI service should raise error on invalid JSON"""
        with patch('ai_service.AsyncOpenAI'):
            service = AIService(api_key="test-key")
            with pytest.raises(AIServiceError):
                service._parse_json_response('not valid json', "test")


# Model validation tests
class TestModelValidation:
    """Tests for Pydantic model validation"""

    def test_transcript_request_validates_min_length(self):
        """TranscriptRequest should validate minimum length"""
        from models import TranscriptRequest
        with pytest.raises(ValueError):
            TranscriptRequest(transcript="short")

    def test_transcript_request_accepts_valid_transcript(self):
        """TranscriptRequest should accept valid transcript"""
        from models import TranscriptRequest
        req = TranscriptRequest(transcript="A" * 100)
        assert len(req.transcript) == 100

    def test_feedback_request_validates_section_type(self):
        """FeedbackRequest should validate section_to_edit"""
        from models import FeedbackRequest
        with pytest.raises(ValueError):
            FeedbackRequest(
                original_response={},  # Would fail anyway
                feedback="test feedback",
                section_to_edit="invalid"
            )

    def test_section_type_enum_values(self):
        """SectionType enum should have correct values"""
        assert SectionType.INCIDENT_FORM.value == "incident_form"
        assert SectionType.DRAFT_EMAIL.value == "draft_email"
        assert SectionType.ALL.value == "all"


# DateTime validation tests
class TestDateTimeValidation:
    """Tests for ISO 8601 datetime validation"""

    def test_valid_iso_datetime_accepted(self):
        """Valid ISO 8601 datetime should be accepted"""
        form = IncidentForm(
            date_and_time_of_incident="2025-01-31T14:30:00",
            service_user_name="Test User",
            location_of_incident="Living room",
            type_of_incident="Fall",
            description_of_incident="Test description here",
            immediate_actions_taken="Called supervisor",
            was_first_aid_administered=False,
            were_emergency_services_contacted=False,
            who_was_notified="Supervisor",
            agreed_next_steps="Review risk assessment",
            risk_assessment_needed=True
        )
        assert form.date_and_time_of_incident == "2025-01-31T14:30:00"

    def test_iso_datetime_with_timezone_accepted(self):
        """ISO 8601 datetime with timezone should be accepted"""
        form = IncidentForm(
            date_and_time_of_incident="2025-01-31T14:30:00+00:00",
            service_user_name="Test User",
            location_of_incident="Living room",
            type_of_incident="Fall",
            description_of_incident="Test description here",
            immediate_actions_taken="Called supervisor",
            was_first_aid_administered=False,
            were_emergency_services_contacted=False,
            who_was_notified="Supervisor",
            agreed_next_steps="Review risk assessment",
            risk_assessment_needed=True
        )
        assert form.date_and_time_of_incident == "2025-01-31T14:30:00+00:00"

    def test_iso_datetime_with_z_suffix_accepted(self):
        """ISO 8601 datetime with Z suffix should be accepted"""
        form = IncidentForm(
            date_and_time_of_incident="2025-01-31T14:30:00Z",
            service_user_name="Test User",
            location_of_incident="Living room",
            type_of_incident="Fall",
            description_of_incident="Test description here",
            immediate_actions_taken="Called supervisor",
            was_first_aid_administered=False,
            were_emergency_services_contacted=False,
            who_was_notified="Supervisor",
            agreed_next_steps="Review risk assessment",
            risk_assessment_needed=True
        )
        assert form.date_and_time_of_incident == "2025-01-31T14:30:00Z"

    def test_invalid_datetime_rejected(self):
        """Invalid datetime like 'banana' should be rejected"""
        with pytest.raises(ValueError) as exc_info:
            IncidentForm(
                date_and_time_of_incident="banana",
                service_user_name="Test User",
                location_of_incident="Living room",
                type_of_incident="Fall",
                description_of_incident="Test description here",
                immediate_actions_taken="Called supervisor",
                was_first_aid_administered=False,
                were_emergency_services_contacted=False,
                who_was_notified="Supervisor",
                agreed_next_steps="Review risk assessment",
                risk_assessment_needed=True
            )
        assert "ISO 8601" in str(exc_info.value)

    def test_partial_datetime_rejected(self):
        """Partial datetime should be rejected"""
        with pytest.raises(ValueError):
            IncidentForm(
                date_and_time_of_incident="2025-01-31",
                service_user_name="Test User",
                location_of_incident="Living room",
                type_of_incident="Fall",
                description_of_incident="Test description here",
                immediate_actions_taken="Called supervisor",
                was_first_aid_administered=False,
                were_emergency_services_contacted=False,
                who_was_notified="Supervisor",
                agreed_next_steps="Review risk assessment",
                risk_assessment_needed=True
            )


# Email list validation tests
class TestEmailListValidation:
    """Tests for email list validation in DraftEmail"""

    def test_string_email_converted_to_list(self):
        """Single string email should be converted to list"""
        email = DraftEmail(
            to="test@example.com",
            subject="Test Subject",
            body="This is a test email body."
        )
        assert email.to == ["test@example.com"]

    def test_list_of_emails_accepted(self):
        """List of valid emails should be accepted"""
        email = DraftEmail(
            to=["one@example.com", "two@example.com"],
            subject="Test Subject",
            body="This is a test email body."
        )
        assert email.to == ["one@example.com", "two@example.com"]

    def test_empty_string_email_rejected(self):
        """Empty string email should be rejected"""
        with pytest.raises(ValueError) as exc_info:
            DraftEmail(
                to="",
                subject="Test Subject",
                body="This is a test email body."
            )
        assert "empty" in str(exc_info.value).lower()

    def test_list_with_empty_string_rejected(self):
        """List containing empty string should be rejected"""
        with pytest.raises(ValueError) as exc_info:
            DraftEmail(
                to=["valid@example.com", ""],
                subject="Test Subject",
                body="This is a test email body."
            )
        assert "empty" in str(exc_info.value).lower()

    def test_list_with_whitespace_only_rejected(self):
        """List containing whitespace-only string should be rejected"""
        with pytest.raises(ValueError) as exc_info:
            DraftEmail(
                to=["valid@example.com", "   "],
                subject="Test Subject",
                body="This is a test email body."
            )
        assert "empty" in str(exc_info.value).lower()

    def test_list_with_none_value_rejected(self):
        """List containing None should be rejected"""
        with pytest.raises(ValueError):
            DraftEmail(
                to=["valid@example.com", None],
                subject="Test Subject",
                body="This is a test email body."
            )

    def test_email_strings_are_stripped(self):
        """Email strings should be stripped of whitespace"""
        email = DraftEmail(
            to="  test@example.com  ",
            subject="Test Subject",
            body="This is a test email body."
        )
        assert email.to == ["test@example.com"]

    def test_cc_none_accepted(self):
        """CC field with None should be accepted"""
        email = DraftEmail(
            to=["test@example.com"],
            cc=None,
            subject="Test Subject",
            body="This is a test email body."
        )
        assert email.cc is None

    def test_invalid_type_rejected(self):
        """Non-string, non-list type should be rejected"""
        with pytest.raises(ValueError) as exc_info:
            DraftEmail(
                to=123,
                subject="Test Subject",
                body="This is a test email body."
            )
        assert "string or list" in str(exc_info.value).lower()


# PolicyAnalysis list validation tests
class TestPolicyAnalysisValidation:
    """Tests for PolicyAnalysis list validation"""

    def test_valid_lists_accepted(self):
        """Valid string lists should be accepted"""
        from models import PolicyAnalysis
        analysis = PolicyAnalysis(
            relevant_policies=["Policy 1", "Policy 2"],
            policy_compliance=["Item 1"],
            recommended_actions=["Action 1", "Action 2"],
            concerns=["Concern 1"]
        )
        assert len(analysis.relevant_policies) == 2

    def test_empty_strings_filtered_out(self):
        """Empty strings should be filtered from lists"""
        from models import PolicyAnalysis
        analysis = PolicyAnalysis(
            relevant_policies=["Policy 1", "", "Policy 2", "   "],
            policy_compliance=[],
            recommended_actions=[],
            concerns=[]
        )
        assert analysis.relevant_policies == ["Policy 1", "Policy 2"]

    def test_strings_are_stripped(self):
        """Strings in lists should be stripped of whitespace"""
        from models import PolicyAnalysis
        analysis = PolicyAnalysis(
            relevant_policies=["  Policy 1  ", "Policy 2  "],
            policy_compliance=[],
            recommended_actions=[],
            concerns=[]
        )
        assert analysis.relevant_policies == ["Policy 1", "Policy 2"]

    def test_none_converted_to_empty_list(self):
        """None should be converted to empty list"""
        from models import PolicyAnalysis
        analysis = PolicyAnalysis(
            relevant_policies=None,
            policy_compliance=None,
            recommended_actions=None,
            concerns=None
        )
        assert analysis.relevant_policies == []

    def test_non_string_items_rejected(self):
        """Non-string items in list should be rejected"""
        from models import PolicyAnalysis
        with pytest.raises(ValueError) as exc_info:
            PolicyAnalysis(
                relevant_policies=["Valid", 123],
                policy_compliance=[],
                recommended_actions=[],
                concerns=[]
            )
        assert "strings" in str(exc_info.value).lower()


# IncidentForm min_length validation tests
class TestIncidentFormMinLength:
    """Tests for IncidentForm min_length constraints"""

    def test_empty_immediate_actions_rejected(self):
        """Empty immediate_actions_taken should be rejected"""
        with pytest.raises(ValueError):
            IncidentForm(
                date_and_time_of_incident="2025-01-31T14:30:00",
                service_user_name="Test User",
                location_of_incident="Living room",
                type_of_incident="Fall",
                description_of_incident="Test description here",
                immediate_actions_taken="",
                was_first_aid_administered=False,
                were_emergency_services_contacted=False,
                who_was_notified="Supervisor",
                agreed_next_steps="Review risk assessment",
                risk_assessment_needed=True
            )

    def test_empty_who_was_notified_rejected(self):
        """Empty who_was_notified should be rejected"""
        with pytest.raises(ValueError):
            IncidentForm(
                date_and_time_of_incident="2025-01-31T14:30:00",
                service_user_name="Test User",
                location_of_incident="Living room",
                type_of_incident="Fall",
                description_of_incident="Test description here",
                immediate_actions_taken="Called supervisor",
                was_first_aid_administered=False,
                were_emergency_services_contacted=False,
                who_was_notified="",
                agreed_next_steps="Review risk assessment",
                risk_assessment_needed=True
            )

    def test_empty_agreed_next_steps_rejected(self):
        """Empty agreed_next_steps should be rejected"""
        with pytest.raises(ValueError):
            IncidentForm(
                date_and_time_of_incident="2025-01-31T14:30:00",
                service_user_name="Test User",
                location_of_incident="Living room",
                type_of_incident="Fall",
                description_of_incident="Test description here",
                immediate_actions_taken="Called supervisor",
                was_first_aid_administered=False,
                were_emergency_services_contacted=False,
                who_was_notified="Supervisor",
                agreed_next_steps="",
                risk_assessment_needed=True
            )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
