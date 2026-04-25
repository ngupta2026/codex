# ArogyaYatra Auth and Authorization Figma Prompt

Use the prompt below in Figma or with a Figma design assistant to create a block-diagram explanation of the planned authentication and authorization architecture for ArogyaYatra.

## Prompt

```text
Create a clean healthcare-safe architecture diagram in Figma for ArogyaYatra, an AI-enabled post-discharge virtual care app. The diagram should explain how authentication and authorization will be added for Admin, Developer, Patient, Nurse, and Pharmacist users.

Use a calm healthcare visual style:
- soft white background
- pale aqua gradient accents
- navy and teal primary colors
- rounded cards
- subtle arrows
- clean modern typography
- clear separation between authentication, authorization, data access, and app features

Frame size:
- 1600 x 1000 for the main architecture frame
- optional second frame 1600 x 900 for access rules by role

Title:
ArogyaYatra Authentication and Authorization Architecture

Subtitle:
Secure role-based access for patient-centric care coordination, virtual consultations, medication continuity, and developer workflows.

Build the diagram in these layers from top to bottom:

1. Experience layer
Show these entry points as rounded cards:
- Home
- Login
- Admin board
- Patient board
- Nurse board
- Pharmacist board
- Developer board
- Chat assistant
- Virtual consultation UI

2. Authentication layer
Show:
- Login form
- Credentials provider
- Password verification
- Session creation
- Session cookie or JWT

Add a note:
Authentication confirms who the user is.

3. Authorization layer
Show:
- Middleware route guard
- Server-side session check
- Role validator
- Scope validator

Add a note:
Authorization decides what the user can access after login.

4. Role access model
Create one block for each role:
- Admin: can access admin board and operational coordination APIs
- Developer: can access developer board and feature feedback flows
- Patient: can access only their own patient page and own care context
- Nurse: can access nurse board and assigned patient panels
- Pharmacist: can access pharmacist board and linked medication queues

Add a small shield or lock icon to each role block.

5. Protected application layer
Show:
- Next.js pages
- API routes
- /api/chat
- /api/developer-prompt
- future action APIs

Indicate:
- client cannot choose role directly
- server derives role from session
- API requests are scoped by session identity

6. Data and scope layer
Show:
- users table
- patients table
- nurses table
- pharmacists table
- patient assignments
- audit log

Use connectors to show:
- patient session -> only own patient record
- nurse session -> assigned patients
- pharmacist session -> linked medication queue
- admin session -> operational overview
- developer session -> developer tooling and feedback workflows

7. Safe agent runtime layer
Show:
- context loader
- coordinator
- specialist agents
- policy engine
- reviewer

Add a note:
The agent runtime uses authenticated role and allowed scope from the session. It must not trust role values from the client.

8. Human oversight and governance layer
Show:
- audit trail
- escalation workflow
- future approval checkpoint for higher-risk actions

Add a footer:
Security principle: hide links in the UI for usability, but enforce access on the server through middleware, session checks, scoped data loading, and API authorization.

Visual requirements:
- use arrows to show flow from login to session to route protection to scoped data
- use distinct color bands for authentication, authorization, protected APIs, and agent runtime
- highlight middleware and server-side checks as the main security boundary
- keep the style executive and explainable, not overly technical

Also create a second optional frame titled:
Role-Based Access Matrix

In that frame, create a simple matrix with rows:
- Admin
- Developer
- Patient
- Nurse
- Pharmacist

And columns:
- Home
- Login
- Admin board
- Patient board
- Nurse board
- Pharmacist board
- Developer board
- /api/chat
- /api/developer-prompt
- Patient data scope
- Audit logs

Use checkmarks, partial access icons, and lock icons to show who can access what.
```

## Recommended seeded account model for the diagram

Use these blocks in the diagram or an adjacent notes section:

- Admin
  - Anita Patel
  - anita.patel@arogyayatra.health
  - role: admin
- Developer
  - Neeraj Gupta
  - neeraj.gupta@arogyayatra.health
  - role: developer
- Patients
  - Maya Rivera
  - James Thornton
  - Margaret Ellis
- Nurses
  - Sarah Johnson
  - Michael Brown
  - Priya Menon
- Pharmacists
  - Olivia Martin
  - Ethan Cole

## Implementation note

This diagram should reflect the planned implementation path:

1. Add login and session handling.
2. Protect routes with middleware.
3. Protect APIs with server-side session validation.
4. Scope data loading by role and linked entity id.
5. Pass authenticated role and allowed scope into the agent runtime.
6. Keep policy and reviewer layers in control of sensitive flows.
