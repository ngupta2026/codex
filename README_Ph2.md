# Phase 2 Acceptance Criteria

Phase 2 covers the **data layer and authentication/authorization** implementation for ArogyaYatra.

Phase 2 is considered complete when all of the following are true:

1. PostgreSQL support exists through Prisma schema, migrations, and seed files.
2. The data model includes:
   - `users`
   - `patients`
   - `nurses`
   - `pharmacists`
   - `patient assignments`
   - `medications`
   - `vitals`
   - `appointments`
   - `journey events`
   - `traces`
   - `tool calls`
   - `policy events`
   - `feedback`
   - `audit logs`
3. Real login and logout routes exist.
4. Protected routes require authentication.
5. Authorization is enforced on the server, not only in the UI.
6. A patient can access only their own patient page.
7. A nurse can access only the nurse board and assigned patient scope.
8. A pharmacist can access only the pharmacist board and linked medication queue scope.
9. An admin can access operational views and broad coordination scope.
10. A developer can access observability and review tools, but not patient-care chat actions as a care operator.
11. `/api/chat` derives role and scope from the authenticated session instead of trusting client-supplied role claims.
12. The app builds and automated tests pass.
13. Manual route-by-route validation confirms login flow, redirect behavior, and scoped access.

## Local Run

```powershell
cd E:\Courses\Handshake\Codex\VCC\arogyayatra-next-app
npm install
npm run dev:local
```

Open:

```text
http://127.0.0.1:3099/
```

## Demo Login Accounts

- `Admin` : `anita.patel@arogyayatra.health` / `Admin123!`
- `Patient` : `maya.rivera@example.com` / `Patient123!`
- `Nurse` : `sarah.johnson@arogyayatra.health` / `Nurse123!`
- `Pharmacist` : `olivia.martin@arogyayatra.health` / `Pharmacist123!`
- `Developer` : `neeraj.gupta@arogyayatra.health` / `Developer123!`

## 13-Step Manual Validation Flow

### 1. Protected routes should reject anonymous access

While logged out, try opening:

- `http://127.0.0.1:3099/admin`
- `http://127.0.0.1:3099/patient/PT-1001`
- `http://127.0.0.1:3099/nurse`
- `http://127.0.0.1:3099/pharmacist`
- `http://127.0.0.1:3099/developer`

Expected result:
- you are redirected back to Home
- the sign-in form is shown

### 2. Patient login should land on the linked patient page

From Home, sign in as:

- `maya.rivera@example.com`
- `Patient123!`

Expected result:
- redirect to `/patient/PT-1001`

### 3. Patient should not access another patient

While signed in as Patient, manually change the URL to:

- `/patient/PT-1002`

Expected result:
- access is blocked
- you are redirected away from that patient

### 4. Patient should not access other role boards

While still signed in as Patient, try:

- `/admin`
- `/nurse`
- `/pharmacist`
- `/developer`

Expected result:
- access is blocked
- you are redirected to the patient home path

### 5. Nurse login should land on the nurse board

Sign out, then sign in as:

- `sarah.johnson@arogyayatra.health`
- `Nurse123!`

Expected result:
- redirect to `/nurse`

### 6. Nurse should see assigned patient scope only

On the Nurse board, review the patient queue/assignment section.

Expected result:
- nurse-scoped patient content is shown
- the board is not treated like an admin or developer surface

### 7. Pharmacist login should land on the pharmacist board

Sign out, then sign in as:

- `olivia.martin@arogyayatra.health`
- `Pharmacist123!`

Expected result:
- redirect to `/pharmacist`

### 8. Pharmacist should see medication queue scope only

On the Pharmacist board, review the patient queue and medication review sections.

Expected result:
- pharmacist queue content is shown
- no nurse/admin-only controls are exposed as primary workflow

### 9. Admin login should land on the admin board

Sign out, then sign in as:

- `anita.patel@arogyayatra.health`
- `Admin123!`

Expected result:
- redirect to `/admin`

### 10. Admin should have operational overview access

While signed in as Admin:

- confirm the admin board loads
- then open `/patient/PT-1001`

Expected result:
- admin board is accessible
- patient route is also accessible for operational review

### 11. Developer login should land on the developer board

Sign out, then sign in as:

- `neeraj.gupta@arogyayatra.health`
- `Developer123!`

Expected result:
- redirect to `/developer`

### 12. Developer should not act as a patient-care operator

While signed in as Developer:

- open the Developer board
- do not expect patient-care chat behavior

Expected result:
- observability/review tools are available
- developer is not treated like Admin, Nurse, Patient, or Pharmacist in care workflows

### 13. Feedback board should remain usable

Open:

- `http://127.0.0.1:3099/feedback`

Expected result:
- feedback page loads
- protected clinical scope is not leaked into a public feedback flow

## Database Verification

Phase 2 includes PostgreSQL support, but you should verify both:

- **Auth fallback mode**
- **Real database mode**

### Fallback mode

Without `DATABASE_URL`, the app should still allow demo login through seeded fallback accounts.

### Database mode

Add `DATABASE_URL` in your env, then run:

```powershell
cd E:\Courses\Handshake\Codex\VCC\arogyayatra-next-app
npm run db:generate
npm run db:push
npm run db:seed
```

Then repeat the manual login tests above.

Expected result:
- sign-in still works
- scoped access still works
- feedback, traces, policy events, and audit events can be persisted through Prisma

## Automated Validation

Run:

```powershell
cd E:\Courses\Handshake\Codex\VCC\arogyayatra-next-app
npm run build
npm run test:unit
npm run test:e2e
```

Expected result:
- build passes
- unit tests pass
- Playwright smoke tests pass

## Final Sign-Off

Phase 2 can be signed off when:

- all 13 manual steps behave as expected
- build/test commands pass
- database-backed mode is verified when `DATABASE_URL` is provided
