# ArogyaYatra Side Panel Login Figma Prompt

Use this prompt in Figma or with a Figma design assistant to generate a revised ArogyaYatra side panel that includes login options while preserving the app's healthcare-safe visual style.

## Prompt

```text
Create a redesigned left side panel for ArogyaYatra, an AI-enabled post-discharge virtual care platform. The design should combine brand presence, role navigation, and login/sign-in options in a calm, premium, healthcare-safe layout.

Primary goal:
Replace the current simple navigation sidebar with a richer side panel that supports:
- ArogyaYatra branding
- short product explanation
- sign-in entry point
- role-based workspace access
- security/trust message

The design should be inspired by the attached reference layout, but adapted for ArogyaYatra’s existing product structure and customer-focused healthcare experience.

## Product context

ArogyaYatra supports:
- Home
- Admin
- Patient
- Nurse
- Pharmacist
- Developer

The product is:
- patient-centric
- journey-oriented
- focused on care coordination, medication continuity, virtual consultations, and safe escalation

The sidebar should feel:
- calm
- modern
- secure
- welcoming
- healthcare trustworthy

## Design direction

Use a soft white and sea-glass healthcare palette:
- navy for headings
- teal for interactive emphasis
- pale aqua backgrounds
- subtle shadows
- rounded cards
- clean dividers

Typography should feel modern, accessible, and premium.
Do not make it look like a generic developer console. It should remain clearly healthcare/customer oriented.

## Frame

Design a desktop left sidebar panel around:
- width: 300 to 340 px
- full viewport height

## Sidebar structure

### 1. Brand block at top

Include:
- ArogyaYatra logo
- product name: ArogyaYatra
- descriptor: AI enabled Healthcare Coordinator

Optional short headline:
- AI-powered care coordination platform

Optional support copy:
- Bringing patients, nurses, pharmacists, and care teams together for a better recovery journey.

### 2. Trust / reassurance card

Add a small card below the intro that communicates safety and trust.

Examples:
- Trusted for secure virtual care coordination
- Your data is protected with role-based access and safe review

Use a shield / healthcare-safe icon.

### 3. Login block

Add a welcoming sign-in area.

Include:
- heading: Welcome back
- short line: Sign in to continue
- email input
- password input
- forgot password link
- primary sign-in button

Below that, optionally add secondary auth options:
- Sign in with Google
- Sign in with Microsoft
- Sign in with SSO

Keep the experience elegant and uncluttered.

### 4. Role access area

Below login, show a section titled:
- Available Workspaces

Show compact role items or tiles for:
- Home
- Admin
- Patient
- Nurse
- Pharmacist
- Developer

Each should have:
- role icon
- short helper label
- subtle active/disabled/locked state treatment

Important:
- In the public pre-login view, these may appear as preview options or role destinations
- In the post-login state, the allowed role should appear active and unauthorized roles should appear locked or hidden

### 5. Footer reassurance

At the bottom, include a small trust line such as:
- Your data is secure and compliant with healthcare privacy standards

Use a compact icon and soft background.

## States to design

Create 3 variants in the same Figma file:

### Variant A: Public pre-login sidebar
- branding visible
- welcome/login form visible
- workspaces shown as preview options

### Variant B: Logged-in patient sidebar
- patient role active
- login form replaced by a signed-in account block
- unauthorized roles de-emphasized or hidden

### Variant C: Logged-in developer/admin sidebar
- admin or developer role active
- account menu shown
- workspaces and tools feel more operational

## Components to include

Create reusable components for:
- sidebar brand header
- trust card
- input field
- password field
- primary sign-in button
- secondary auth button
- role nav item
- locked role nav item
- active role nav item
- footer trust note

## Copy suggestions

Brand copy:
- ArogyaYatra
- AI enabled Healthcare Coordinator

Welcome copy:
- Welcome back
- Sign in to continue your care coordination journey

Trust copy:
- Trusted for secure, role-based healthcare coordination
- Your access is protected and scoped by role

Footer copy:
- Your data is secure and compliant with healthcare privacy standards

## Visual constraints

- Keep it softer and more customer-friendly than a backend admin console
- Avoid dense enterprise clutter
- Avoid making login feel like a separate unrelated product
- Preserve ArogyaYatra as a guided care journey platform
- Keep enough space for the main content area to the right

## Role icon guidance

Use healthcare-intuitive icons:
- Home: house
- Admin: shield/gear
- Patient: person
- Nurse: clinician/cross/stethoscope
- Pharmacist: medication clipboard or pill
- Developer: code brackets
- Login/security: shield, key, or user-access icon

## Layout outcome

The final sidebar should communicate:
- who the product is for
- how to sign in
- what workspaces exist
- that access is role-based and secure

It should feel like the natural left rail for the ArogyaYatra application, not a pasted login widget.
```

## What Is Possible In The App

This design can be implemented in the current ArogyaYatra app in a few practical ways:

### Option 1: Public login block in sidebar

- Add a compact login card directly inside the sidebar for all unauthenticated users
- Keep `Available Workspaces` below it
- Once logged in, replace the login form with account/profile summary

### Option 2: Sidebar login CTA only

- Keep the sidebar lighter
- Add `Sign in` and `Request access` buttons
- Open a modal or dedicated login page instead of showing the full form in the rail

### Option 3: Hybrid approach

- On Home page: show the richer login-enabled sidebar
- On authenticated role boards: replace the login form with profile, role badge, and quick account actions

## Recommended Approach

For ArogyaYatra, the best UX is usually **Option 3**:

- richer sidebar on the public Home page
- cleaner role-specific sidebar once authenticated
- role-based authorization enforced on the server
- login block visually integrated into the brand/trust experience

This fits the current product direction best and avoids making every board feel overly crowded.
