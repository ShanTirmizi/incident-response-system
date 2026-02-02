"""
FastAPI backend for AI-Enhanced Incident Response System

This API processes social care call/meeting transcripts, analyzes them against
policies, generates incident forms, and drafts notification emails.
"""
import json
import logging
import os
import uuid
from contextvars import ContextVar
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from functools import lru_cache
from typing import Annotated, Optional

from fastapi import FastAPI, HTTPException, Depends, Request, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from pydantic import ValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from models import (
    TranscriptRequest,
    AnalysisResponse,
    FeedbackRequest,
    HealthResponse,
)
from ai_service import AIService, AIServiceError
from policies import POLICIES_DOCUMENT, INCIDENT_FORM_TEMPLATE

# Load environment variables
load_dotenv()

# Context variable for request correlation ID
request_id_ctx: ContextVar[str] = ContextVar('request_id', default='')


class StructuredFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "request_id": request_id_ctx.get(''),
            "module": record.module,
            "function": record.funcName,
        }
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data)


# Configure structured logging
def setup_logging() -> logging.Logger:
    """Configure logging with structured JSON format."""
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.INFO)

    # Remove existing handlers
    logger.handlers.clear()

    # Add structured handler
    handler = logging.StreamHandler()
    handler.setFormatter(StructuredFormatter())
    logger.addHandler(handler)

    return logger


logger = setup_logging()

# Create rate limiter
limiter = Limiter(key_func=get_remote_address)


# Configuration class for dependency injection
class Settings:
    """Application settings loaded from environment for AI service configuration."""
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o")
        self.fallback_model = os.getenv("OPENAI_FALLBACK_MODEL", "gpt-3.5-turbo")
        self.max_retries = int(os.getenv("OPENAI_MAX_RETRIES", "3"))
        self.timeout = int(os.getenv("OPENAI_TIMEOUT", "60"))

        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")


@lru_cache()
def get_settings() -> Settings:
    """Cached settings loader - dependency injection"""
    return Settings()


# Singleton AIService instance
_ai_service: Optional[AIService] = None


def get_ai_service() -> AIService:
    """
    Dependency injection for AI service.
    Returns the singleton instance initialized at startup.

    Raises:
        RuntimeError: If AI service not initialized
    """
    if _ai_service is None:
        raise RuntimeError("AI Service not initialized. Application may not have started properly.")
    return _ai_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown"""
    global _ai_service

    # Startup - initialize singleton AI service
    try:
        settings = get_settings()
        _ai_service = AIService(
            api_key=settings.openai_api_key,
            model=settings.model,
            fallback_model=settings.fallback_model,
            max_retries=settings.max_retries,
            timeout=settings.timeout
        )
        logger.info(f"AI Service singleton initialized with model: {settings.model}")
        logger.info("Application startup complete")
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        raise

    yield

    # Shutdown
    _ai_service = None
    logger.info("Shutting down application")


# Initialize FastAPI app
app = FastAPI(
    title="AI-Enhanced Incident Response System",
    description="Processes social care transcripts and generates incident reports",
    version="1.0.0",
    lifespan=lifespan
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS middleware (must be added before routes)
# Load allowed origins at module level (separate from Settings to avoid API key check)
_allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Request-ID"],
)


@app.middleware("http")
async def add_correlation_id(request: Request, call_next):
    """Middleware to add correlation ID to all requests."""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request_id_ctx.set(request_id)
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# Global exception handler for validation errors
@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    """Handle Pydantic validation errors with clear messages"""
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        errors.append(f"{field}: {error['msg']}")
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation error", "errors": errors}
    )


# Global exception handler for AI service errors
@app.exception_handler(AIServiceError)
async def ai_service_exception_handler(request: Request, exc: AIServiceError):
    """Handle AI service errors"""
    logger.error(f"AI Service error: {exc}")
    return JSONResponse(
        status_code=503,
        content={"detail": f"AI service unavailable: {str(exc)}"}
    )


# Health check at root level (common convention)
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint to verify the API is running.

    Returns:
        HealthResponse with status, timestamp, and version
    """
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(timezone.utc).isoformat(),
        version="1.0.0"
    )


# API v1 Router
v1_router = APIRouter(prefix="/v1", tags=["v1"])


@v1_router.post("/analyze", response_model=AnalysisResponse)
@limiter.limit("10/minute")
async def analyze_transcript(
    request: Request,
    body: TranscriptRequest,
    ai_service: Annotated[AIService, Depends(get_ai_service)]
):
    """
    Analyze a transcript and generate incident response documents.

    This endpoint:
    1. Receives transcript data from the frontend
    2. Analyzes the transcript against care policies
    3. Generates a filled incident report form
    4. Drafts an email to appropriate recipients

    Rate limited to 10 requests per minute per IP.

    Args:
        request: FastAPI Request object (for rate limiting)
        body: TranscriptRequest containing the transcript text
        ai_service: Injected AI service instance

    Returns:
        AnalysisResponse with incident form, policy analysis, and draft email

    Raises:
        HTTPException: If analysis fails
    """
    logger.info(f"Received transcript for analysis ({len(body.transcript)} chars)")

    try:
        result = await ai_service.analyze_transcript(
            transcript=body.transcript,
            additional_context=body.additional_context
        )
        logger.info("Analysis completed successfully")
        return result

    except AIServiceError:
        # Re-raise to be handled by exception handler
        raise
    except Exception as e:
        logger.error(f"Unexpected error analyzing transcript: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to analyze transcript. Please try again."
        )


@v1_router.post("/refine", response_model=AnalysisResponse)
@limiter.limit("20/minute")
async def refine_with_feedback(
    request: Request,
    body: FeedbackRequest,
    ai_service: Annotated[AIService, Depends(get_ai_service)]
):
    """
    Refine generated content based on user feedback.

    Allows users to provide feedback to edit the generated incident form
    or draft email.

    Rate limited to 20 requests per minute per IP.

    Args:
        request: FastAPI Request object (for rate limiting)
        body: FeedbackRequest with original response and feedback
        ai_service: Injected AI service instance

    Returns:
        Updated AnalysisResponse incorporating the feedback

    Raises:
        HTTPException: If refinement fails
    """
    logger.info(f"Received feedback for section: {body.section_to_edit.value}")

    try:
        result = await ai_service.refine_with_feedback(
            original=body.original_response,
            feedback=body.feedback,
            section=body.section_to_edit
        )
        logger.info("Refinement completed successfully")
        return result

    except AIServiceError:
        raise
    except Exception as e:
        logger.error(f"Error refining content: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to refine content. Please try again."
        )


@v1_router.get("/policies")
async def get_policies():
    """
    Get the policies document for reference.

    Returns:
        The policies document text
    """
    return {"policies": POLICIES_DOCUMENT}


@v1_router.get("/form-template")
async def get_form_template():
    """
    Get the incident form template structure.

    Returns:
        The form template with field definitions
    """
    return {"template": INCIDENT_FORM_TEMPLATE}


# Include the v1 router
app.include_router(v1_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
