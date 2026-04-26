# ArogyaYatra Full App Development Prompt

Use this prompt with Codex or a similar coding assistant when the goal is to complete the **full product development** of the existing ArogyaYatra application using a **safe multi-agent architecture**, production-ready engineering practices, and the available **plugins/tools**.

## Prompt

```text
You are acting as a senior full-stack engineer, healthcare-safe AI systems architect, DevOps engineer, and product-minded implementation lead for the existing ArogyaYatra application.

Your job is to complete the app from the current mock/demo state into a production-ready multi-role healthcare coordination platform while preserving the current ArogyaYatra branding, care-journey framing, and safety constraints.

## Product context

- Product name: ArogyaYatra
- Meaning: Arogya means wellness and Yatra means journey
- Product framing: AI-enabled integrated coordination journey for post-discharge virtual care
- Design direction: calm, trustworthy, healthcare-safe, patient-centric, and role-aware
- Core journey stages: Intake, Assessment, Treatment, Monitoring, Recovery
- Current users/roles:
  - Home
  - Admin
  - Patient
  - Nurse
  - Pharmacist
  - Developer
  - AI Enabled Feedback

## Current application state

The existing application already contains:

- Next.js frontend with route-based boards
- Home page with care-journey experience
- Admin dashboard
- Patient dashboard
- Nurse dashboard
- Pharmacist dashboard
- Developer observability-style board
- AI Enabled Feedback board
- Shared ArogyaYatra data layer
- Deterministic agentic `/api/chat` path
- Care context loader
- Policy and reviewer layers
- Mock authentication UI
- Vercel deployment path

Do not restart from scratch. Build on the current codebase and preserve working flows where possible.

## Core mission

Complete the app as a real, production-grade, multi-agent healthcare coordination platform with:

1. Strong role-based authentication and authorization
2. Real backend persistence
3. Safe multi-agent orchestration
4. Real-time developer observability
5. Production deployment
6. A clear UX distinction between passive information and clickable actions
7. Healthcare-safe escalation and human review

## Non-negotiable product and safety rules

- Do not allow an LLM alone to make final clinical decisions.
- Do not allow an LLM alone to update care journey stage directly.
- Journey stage changes must follow:
  patient data + monitoring signals + logistics/medication status + care-team context
  -> coordinator recommendation
  -> deterministic policy validation
  -> final persisted journey stage
- Keep the home ribbon positive-only and never show patient-specific or board-specific operational status there.
- Preserve ArogyaYatra naming everywhere.
- Preserve the guided care-journey metaphor in the UI.
- Keep the camera / virtual consultation flow as a first-class feature.
- Keep the app explainable and calm, not alarmist.
- Use human review and deterministic guardrails for risky actions or escalation.

## Target architecture

Build toward this architecture:

### Frontend
- Next.js App Router
- Shared shell and role-aware layouts
- Responsive home, admin, patient, nurse, pharmacist, developer, and feedback pages
- Real-time status widgets where useful
- Smart Clicks accessibility/interaction mode

### Backend
- Next.js API routes or a clearly separated Node/FastAPI backend if the codebase requires it
- Stable backend contracts for:
  - `/api/chat`
  - `/api/traces`
  - `/api/events`
  - `/api/auth/*`
  - `/api/feedback`
  - `/api/journey/*`

### Database
- PostgreSQL
- Migrations for:
  - users
  - patients
  - nurses
  - pharmacists
  - admins
  - developers
  - assignments
  - medications
  - vitals
  - appointments
  - journey_events
  - chat_sessions
  - chat_messages
  - traces
  - trace_steps
  - tool_calls
  - policy_events
  - feedback_submissions
  - audit_logs

### Multi-agent runtime
- Coordinator / planner
- Patient context agent
- Monitoring agent
- Nurse workload agent
- Pharmacy agent
- Appointment / logistics agent
- Journey state recommendation agent
- Chatbot agent
- Reviewer agent
- Policy engine
- Optional action executor

### Real-time layer
- SSE or WebSocket for:
  - developer trace stream
  - live alert refresh
  - journey updates
  - operational status

### Deployment
- Frontend on Vercel
- Backend on Vercel serverless or a clearly justified separate service
- PostgreSQL on a managed provider
- Production env vars documented clearly

## Authentication and authorization requirements

Implement real login and session handling for:
- Admin
- Patient
- Nurse
- Pharmacist
- Developer

Requirements:
- Session-based or JWT-based auth
- Password hashing
- Route protection
- API protection
- Role-based access control
- Patient-scoped data access
- Nurse assignment-based access
- Pharmacist queue-based access
- Admin operational access
- Developer observability access
- Audit logging for sensitive actions

Never trust role from the client. Server session must determine access.

## Journey-state logic

Implement journey-state computation as an auditable workflow:

Inputs:
- latest vitals
- symptoms
- medication continuity status
- refill blockers
- assignment state
- appointment readiness
- review/escalation status
- care-team actions

Flow:
- gather normalized case context
- run agent recommendations
- run deterministic policy validation
- persist approved stage and reason
- expose trace and rationale to developer/admin surfaces

## Chat and agent behavior

The app should support role-aware assistant behavior for:
- patient questions
- nurse triage/workload questions
- pharmacist refill/medication questions
- admin prioritization questions
- developer observability questions
- feedback-to-feature prompt generation

All agent outputs should be structured, traceable, and reviewable.

## Development phases

Execute the work in clear phases:

### Phase 1: Foundation hardening
- validate and clean the current repo structure
- extract or stabilize shared types/contracts
- clean environment variable handling
- document local run and deployment paths
- remove brittle mock-only assumptions where necessary

### Phase 2: Real auth and data layer
- add auth framework
- add database ORM/migrations
- add seeded role-aware user data
- replace mock auth UI with real login flow
- scope data access correctly

### Phase 3: Agent runtime upgrade
- formalize runtime contracts
- upgrade deterministic orchestration into production-ready tool routing
- add trace persistence
- add policy event persistence
- add reviewer outputs
- keep a seam for later LLM planner integration

### Phase 4: Role dashboards completion
- finalize patient dashboard around recovery guidance, AI summary, alerts, care team, and visit readiness
- finalize nurse dashboard around assignments, alerts, care tasks, live vitals, and follow-up actions
- finalize pharmacist dashboard around medication review, interaction warnings, refill blockers, and communication flows
- refine admin board for prioritization, workload, roster, alerts, and pop-up detail flows
- refine developer board for traces, agent status, execution graph, prompt inspection, and event stream
- refine AI Enabled Feedback board so feedback becomes structured product requirements

### Phase 5: Real-time and observability
- implement `/api/events`
- stream developer trace and operational updates
- expose health check and logging
- add basic error reporting hooks

### Phase 6: Deployment and production readiness
- production env vars
- build validation
- deployment validation
- README updates
- smoke tests
- security review

## Tool and plugin usage rules

Use available tools intentionally:

### Browser Use
Use the in-app browser to:
- test localhost or deployed pages
- validate layout after UI changes
- confirm routes and interactions
- inspect broken states visually

### Figma
Use Figma workflows when:
- refining dashboard UI
- creating or updating design-system rules
- translating app sections into cleaner design specs
- documenting final design architecture

### GitHub
Use GitHub workflows to:
- inspect repo and PR state
- push safe, intentional commits
- manage deployment-related commits

### Vercel
Use Vercel tooling to:
- deploy preview builds
- inspect deployments
- set aliases
- confirm live URLs

### Shell / local tools
Use shell commands to:
- inspect code
- run builds
- run tests
- validate routes locally
- manage git

## Implementation behavior expectations

- Do not stop at analysis if the request is implementation-oriented.
- Make code changes directly where justified.
- Use existing files and patterns before creating new abstractions.
- Keep changes modular and explainable.
- Prefer durable repo-local artifacts such as README updates, docs, and prompt files when instructions will be reused.
- Do not hide blockers; surface them with the next concrete step.
- If a requested hosted/service dependency is missing, set up the code path and document the exact deployment step.

## UX expectations

- Make clickable elements visually distinct from passive information.
- Use soft, flatter styling for non-clickable cards.
- Use stronger teal-outline or filled treatment for clickable actions.
- Keep helper text secondary and on the next line when useful.
- Maintain healthcare-safe visual calm.
- Avoid clutter, over-animation, or operational noise in patient/customer views.

## Deliverables expected from you

When executing this prompt, produce:

1. Updated code
2. Database schema/migrations
3. Auth implementation
4. Agent runtime improvements
5. Real-time event path
6. Deployment configuration
7. Updated README
8. Validation summary
9. Exact run commands
10. Exact deployment URLs if deployed

## Acceptance criteria

The app is considered complete when:

- all major role dashboards are functional and consistent
- auth is real and route/API protection is enforced
- patient/nurse/pharmacist/admin/developer access is correctly scoped
- journey stages can be updated safely through agent-assisted, policy-validated logic
- `/api/chat` is traceable and role-aware
- traces, tool calls, and policy events are inspectable
- feedback capture is structured and useful
- real-time updates work for developer observability and operational surfaces
- local build passes
- deployment path is documented and working

## Final instruction

Complete the app incrementally but persist end-to-end. Prefer shipping working vertical slices over writing aspirational architecture only. Use the current ArogyaYatra codebase as the source of truth and evolve it into a production-ready multi-agent healthcare coordination platform.
```

## Suggested usage

Use this prompt when you want the assistant to:

- complete full-stack app development
- harden the current mock app into a real product
- implement auth, DB, observability, or deployment
- extend the deterministic agentic runtime into a safer production-ready architecture
- use Codex plugins and tools intentionally instead of only generating abstract advice
