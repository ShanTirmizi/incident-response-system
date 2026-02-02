# AI-Enhanced Incident Response System

A prototype system that processes social care call/meeting transcripts, analyzes them against policies, and generates incident reports and notification emails.

## Features

- **Transcript Analysis**: Processes call transcripts using OpenAI GPT-4
- **Policy Compliance Check**: Analyzes incidents against care policies
- **Incident Form Generation**: Auto-fills incident report forms
- **Email Drafting**: Generates notification emails to appropriate recipients
- **Feedback Refinement**: Allows users to refine generated content
- **Source Quotes**: Provides original quotes for fact-checking

## Project Structure

```
incident-response-system/
├── backend/           # FastAPI Python backend
│   ├── main.py        # API endpoints
│   ├── ai_service.py  # OpenAI integration
│   ├── models.py      # Pydantic models
│   ├── policies.py    # Policies document
│   └── .env           # OpenAI API key
├── frontend/          # Next.js frontend
│   └── src/app/       # React components
└── README.md
```

## Running the Application

### Backend (Terminal 1)

```bash
cd backend
python -m venv venv              # First time only
source venv/bin/activate
pip install -r requirements.txt  # First time only
uvicorn main:app --reload
```

The API will start at http://localhost:8000

### Frontend (Terminal 2)

```bash
cd frontend
npm install      # First time only
npm run dev
```

The UI will be available at http://localhost:3000

## API Endpoints

- `GET /health` - Health check
- `POST /v1/analyze` - Analyze a transcript
- `POST /v1/refine` - Refine content with feedback
- `GET /v1/policies` - Get policies document
- `GET /v1/form-template` - Get form template

## Innovative Feature Proposal: Predictive Risk Intelligence

### The Problem

The sample transcript shows Greg reporting his **third fall this week**. Per policy, recurring falls (2+ per week) require escalated action. But current systems process each incident in isolation—they can't detect that Greg's falls are *accelerating* from 1/month to 3/week, a critical warning sign.

### The Solution

**Predictive Risk Intelligence** transforms the system from reactive incident documentation to proactive care safety.

#### Core Capabilities

| Capability                      | Description                                                                                 |
|---------------------------------|---------------------------------------------------------------------------------------------|
| **Service User Risk Profiles**  | Persistent incident history with running risk score (0-100)                                 |
| **Pattern Detection**           | Frequency acceleration, severity escalation, time-of-day patterns                           |
| **Predictive Alerts**           | Automated warnings when risk thresholds crossed                                             |
| **Organization Analytics**      | Cross-user pattern detection (e.g., multiple falls at same location = environmental hazard) |

#### Example Alert
```
⚠️ HIGH RISK: Greg Jones (Score: 87/100)

Pattern: Fall frequency accelerating
- 30 days ago: 1 fall
- 14 days ago: 2 falls
- This week: 3 falls

Prediction: 78% probability of serious fall within 7 days

Recommended Actions:
1. Emergency moving & handling assessment
2. GP referral for underlying cause
3. Family notification for monitoring
```

#### Technical Implementation

**New API Endpoints:**
- `GET /v1/users/{id}/risk-profile` - Risk score and incident history
- `GET /v1/alerts` - High-risk users requiring attention
- `GET /v1/analytics/patterns` - Detected patterns across users

**Database Requirements:**
- `service_users` - Risk profiles with running scores
- `incidents` - Historical incident data per user
- `patterns` - Detected risk patterns
- `alerts` - Generated predictive alerts

### Why This is a Game-Changer

1. **Saves Lives**: Falls are the #1 cause of injury death in people over 65. Predictive intervention prevents escalation.

2. **Regulatory Compliance**: CQC requires evidence of proactive risk management. Automated alerts provide documentation.

3. **Efficiency**: Instead of reacting to each incident, supervisors get a prioritized list of at-risk users.

4. **Competitive Differentiation**: Similar to Emma AI's "preventative insights" capability that sends 260+ alerts to organizations—but specialized for incident response.

### Implementation Scope

| Component |
|-----------|
| Database + incident storage |
| Risk score calculation |
| Pattern detection (rule-based) |
| Alert generation |
| Dashboard UI |

**MVP**: Store incidents → Calculate risk scores → Generate alerts for high-risk users