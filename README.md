# ArogyaYatra Next App

ArogyaYatra is an AI-enabled healthcare coordinator for post-discharge virtual care. This Next.js app currently delivers the home, admin, patient, nurse, pharmacist, and developer boards plus an agent-ready backend path for page-specific chat.

## Live deployment

The current public deployment is live on Vercel:

- Public URL: `https://arogyayatra-next-app.vercel.app`
- Deployment URL: `https://arogyayatra-next-jkjxg2fiw-ngupta49-9905s-projects.vercel.app`

The Vercel CLI linked this repo to the Vercel project `arogyayatra-next-app`. The local `.vercel` directory stays ignored through `.gitignore`.

## Current agentic implementation

The first backend integration pass is now in place.

Completed:

1. Runtime contract for agentic chat responses.
2. Unified care context loader that maps ArogyaYatra page data into a reusable case input.
3. Reusable coordinator path that can resolve any case input, not only fixed demo scenarios.
4. Tool-style chat orchestration for:
   - patient context
   - monitoring
   - nurse workload
   - pharmacy/refill support
   - appointments
   - virtual visit prep
   - developer prompt flow
5. Deterministic safety review and policy output included in chat responses.
6. `/api/chat` upgraded to `agentic_coordinator_v1`.
7. Traceability fields added: agents used, policy triggers, safe next actions, review state, and execution trace.

Still pending for later phases:

1. Persistent session memory.
2. Retrieval over historical notes, discharge summaries, and prior visits.
3. Action execution tools such as creating reminders, escalation tasks, or virtual visit tasks.
4. Real LLM tool-calling behind the same coordinator contract.
5. Durable audit storage for feedback and chat runs.

## Important files

- `app/api/chat/route.ts`
- `app/api/developer-prompt/route.ts`
- `components/ArogyaYatraDashboard.tsx`
- `lib/arogyayatra-data.ts`
- `lib/developer-prompts.ts`
- `lib/runtime/care-context.ts`
- `lib/runtime/chat-contract.ts`
- `lib/runtime/chat-orchestrator.ts`
- `lib/runtime/orchestrator.ts`
- `lib/runtime/policy.ts`
- `lib/runtime/reviewer.ts`

## Architecture

```text
UI board
  -> /api/chat
  -> agentic coordinator
  -> care context loader
  -> specialist tool functions
  -> deterministic policy + reviewer
  -> structured response back to UI
```

The current chat path is deterministic by design. That is intentional. It keeps safety, escalation, and operational logic explicit while preserving a stable contract for a later LLM-backed coordinator.

## Run locally

PowerShell:

```powershell
cd E:\Courses\Handshake\Codex\VCC\arogyayatra-next-app
npm install
npm run dev:local
```

Open:

```text
http://127.0.0.1:3099
```

Useful routes:

```text
http://127.0.0.1:3099/
http://127.0.0.1:3099/admin
http://127.0.0.1:3099/patient/PT-1001
http://127.0.0.1:3099/nurse
http://127.0.0.1:3099/pharmacist
http://127.0.0.1:3099/developer
```

Production-style local run:

```powershell
cd E:\Courses\Handshake\Codex\VCC\arogyayatra-next-app
npm run build
npm run start:local
```

## Validation used

Build validation:

```powershell
cd E:\Courses\Handshake\Codex\VCC\arogyayatra-next-app
npm run build
```

## Automated testing

This repo now includes:

- `Vitest` for runtime and contract unit tests
- `Playwright` for route and API smoke tests

One-time browser install for e2e:

```powershell
cd E:\Courses\Handshake\Codex\VCC\arogyayatra-next-app
npm run test:e2e:install
```

Run unit tests:

```powershell
cd E:\Courses\Handshake\Codex\VCC\arogyayatra-next-app
npm run test:unit
```

Run end-to-end smoke tests:

```powershell
cd E:\Courses\Handshake\Codex\VCC\arogyayatra-next-app
npm run test:e2e
```

Run the full automated test path:

```powershell
cd E:\Courses\Handshake\Codex\VCC\arogyayatra-next-app
npm test
```

Current automated coverage includes:

- app foundation role and journey contracts
- normalizers and policy behavior
- chat orchestrator response envelope
- route smoke checks for:
  - `/`
  - `/patient/PT-1001`
  - `/developer`
  - `/feedback`
- API smoke check for `/api/chat`

Manual API smoke test example:

```powershell
$body = @{
  role = "admin"
  patientId = "PT-1001"
  question = "What should I review first?"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://127.0.0.1:3099/api/chat" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

Expected chat mode:

```text
agentic_coordinator_v1
```

## Notes

- `README.md` in the workspace root still describes the older static prototype files.
- The current coded app lives in `arogyayatra-next-app`.
- The chat fallback inside the client remains simple on purpose; the real coordinator runs on the API route.
