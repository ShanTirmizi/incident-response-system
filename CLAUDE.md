# Emma AI - Incident Response System

## Project Overview
AI-powered incident response system for social care organizations. Processes call/meeting transcripts to generate incident reports, draft notification emails, and analyze compliance with care policies.

## Architecture

```
incident-response-system/
├── backend/          # Python FastAPI backend
│   ├── main.py       # FastAPI app, endpoints, CORS config
│   ├── ai_service.py # OpenAI integration with retry logic
│   ├── models.py     # Pydantic models for validation
│   ├── policies.py   # Care policies document
│   └── test_api.py   # pytest unit tests
│
└── frontend/         # Next.js 14 frontend
    └── src/
        └── app/
            ├── layout.tsx    # Root layout with Inter font
            ├── page.tsx      # Main UI (single-page app)
            └── globals.css   # Tailwind imports
```

## Tech Stack

**Backend:**
- Python 3.12
- FastAPI (web framework)
- Pydantic (data validation)
- OpenAI API (GPT-4o for analysis)
- uvicorn (ASGI server)

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS

## Running the Project

**Backend:**
```bash
cd backend
pip install fastapi uvicorn pydantic python-dotenv openai==1.58.0 httpx==0.27.0
uvicorn main:app --reload
# Runs on http://localhost:8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

## Environment Variables

**Backend** (`backend/.env`):
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o  # optional, defaults to gpt-4o
```

## API Endpoints

### POST /v1/analyze
Analyzes a transcript and generates incident report, email, and policy analysis.

Request:
```json
{
  "transcript": "string (min 50 chars)",
  "additional_context": "string (optional)"
}
```

Response:
```json
{
  "incident_form": { ... },
  "policy_analysis": { ... },
  "draft_email": {
    "to": ["email@example.com"],
    "cc": ["email@example.com"] | null,
    "subject": "string",
    "body": "string"
  },
  "source_quotes": { ... }
}
```

### POST /v1/refine
Refines a previous analysis based on user feedback.

Request:
```json
{
  "original_response": { ... },
  "feedback": "string",
  "section_to_edit": "all" | "incident_form" | "draft_email"
}
```

### GET /health
Health check endpoint.

## Key Patterns & Conventions

### Backend

**Pydantic Models:**
- Use proper types (e.g., `list[str]` for multiple recipients, not `str`)
- Validators with `mode='before'` for input normalization only
- Field validators for business logic validation

**AI Service:**
- Retry logic with exponential backoff (3 attempts)
- Structured JSON output parsing with error handling
- Separate prompts for each task (policy analysis, form generation, email drafting)

**Error Handling:**
- Custom `AIServiceError` exception class
- Structured error responses with detail messages

### Frontend

**Code Quality & Verification:**

After making changes to the frontend, run these checks before considering work complete:

```bash
cd frontend

# 1. Lint - Check for code quality issues
npm run lint

# 2. Type check - Verify TypeScript types
npm run type-check

# 3. Build - Ensure production build succeeds
npm run build
```

**Linting Rules (`.eslintrc.json`):**
- Extends `next/core-web-vitals` (strict Next.js rules)
- Includes React Hooks rules, accessibility checks, and import validation
- Disabled rules:
  - `react/no-unescaped-entities` - Allows quotes/apostrophes in JSX text
  - `@next/next/no-img-element` - Allows `<img>` instead of `next/image`

**TypeScript Configuration (`tsconfig.json`):**
- `strict: true` - Enables all strict type checking options
- Path alias: `@/*` maps to `./src/*`

**Code Style Guidelines:**

*Naming:*
- Components: PascalCase (`IncidentForm.tsx`)
- Files: kebab-case for non-components (`api-client.ts`)
- Variables/functions: camelCase (`handleSubmit`, `isLoading`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
- Interfaces/Types: PascalCase with descriptive names (`IncidentFormData`, `ApiResponse`)

*Components:*
- One component per file
- Keep components focused and small
- Extract reusable logic into custom hooks
- Props interfaces named `{ComponentName}Props`

*Imports:*
- Group imports: React, external libs, internal modules, styles
- Use path alias `@/` for internal imports

*General:*
- Prefer `const` over `let`
- Use early returns to reduce nesting
- Destructure props and state
- Avoid `any` type - use `unknown` if type is truly unknown

**Styling - IMPORTANT:**
The UI uses a **purple color scheme** with glassmorphism effects. Do NOT use undefined color classes.

Available Tailwind color classes (defined in `tailwind.config.js`):
```
emma-purple          (#7C3AED) - Primary brand color
emma-purple-dark     (#6D28D9) - Hover states
emma-purple-light    (#EDE9FE) - Light backgrounds
emma-purple-lighter  (#F5F3FF) - Very light backgrounds
emma-dark            (#1F2937) - Dark text
emma-gray            (#6B7280) - Secondary text
```

Glassmorphism utility classes (defined in `globals.css`):
```
glass-card           - White frosted glass card
glass-card-purple    - Purple-tinted glass card
glass-card-hover     - Adds hover lift effect
glass-button         - Frosted glass button
glass-button-purple  - Purple glass button (for active states)
glass-input          - Frosted input field
glass-field          - Frosted display field
glass-dark           - Dark glass (for toasts)
glass-purple         - Purple-tinted section
glass-green          - Green-tinted section (success)
glass-red            - Red-tinted section (errors)
glass-amber          - Amber-tinted section (warnings)
glass-shimmer        - Loading shimmer animation
```

**DO NOT USE** these undefined classes (they will silently fail):
- `emma-teal`, `emma-navy`, `emma-success` - NOT DEFINED
- `text-emma-teal`, `bg-emma-teal-light`, `text-emma-navy` - NOT DEFINED

When modifying `page.tsx`, always use the purple color scheme and glass-* utilities.

**State Management:**
- React useState for local state
- No external state library needed (single-page app)

**TypeScript:**
- Interfaces match backend Pydantic models
- Strict typing for API responses

## Testing

```bash
cd backend
pytest test_api.py -v
```

Tests cover:
- Input validation
- API endpoint responses
- Error handling
- Model validation

## Common Issues

**Port already in use:**
```bash
lsof -ti :3000 | xargs kill -9  # Kill process on port 3000
lsof -ti :8000 | xargs kill -9  # Kill process on port 8000
```

**Tailwind not compiling:**
- Ensure `postcss.config.js` and `tailwind.config.js` use CommonJS (`module.exports`)
- Delete `.next` folder and restart dev server

**OpenAI errors:**
- Check API key in `.env`
- Ensure `openai==1.58.0` and `httpx==0.27.0` versions for compatibility
