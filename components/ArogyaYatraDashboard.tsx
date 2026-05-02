"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import type { PendingAccessRequestContract } from "@/lib/app-foundation";
import type { AuthenticatedSession } from "@/lib/auth/repository";
import {
  agentCapabilities,
  developers,
  getPatientById,
  getPatientsByIds,
  nurses,
  patients,
  patientsForNurse,
  patientsForPharmacist,
  pharmacists,
  priorityNurses,
  priorityPatients,
  priorityPharmacists,
  type Patient,
  type Role
} from "@/lib/arogyayatra-data";

type EntitySelection =
  | { type: "patient"; id: string }
  | { type: "nurse"; id: string }
  | { type: "pharmacist"; id: string }
  | null;

const navItems: Array<{ id: Role; label: string; href: string; icon: IconName; hint: string }> = [
  { id: "home", label: "Home", href: "/", icon: "home", hint: "Journey, role routing, and support overview" },
  { id: "admin", label: "Admin", href: "/admin", icon: "admin", hint: "Operations, priorities, and staffing" },
  { id: "patient", label: "Patient", href: "/patient/PT-1001", icon: "patient", hint: "Medicines, vitals, visits, and guidance" },
  { id: "nurse", label: "Nurse", href: "/nurse", icon: "nurse", hint: "Triage queue and follow-up coordination" },
  { id: "pharmacist", label: "Pharmacist", href: "/pharmacist", icon: "pharmacist", hint: "Refills, insurance, and medication continuity" },
  { id: "developer", label: "Developer", href: "/developer", icon: "developer", hint: "Agentic observability, traces, and system control" },
  { id: "feedback", label: "AI Enabled Feedback", href: "/feedback", icon: "spark", hint: "Capture workflow feedback and generate AI feature prompts" }
];

const homeActions: Array<{ label: string; href: string; icon: IconName; detail: string }> = [
  { label: "Admin dashboard", href: "/admin", icon: "admin", detail: "Oversee care operations, staffing pressure, and high-priority coordination." },
  { label: "Patient dashboard", href: "/patient/PT-1001", icon: "patient", detail: "See recovery steps, medicines, virtual visit prep, and safety guidance." },
  { label: "Nurse dashboard", href: "/nurse", icon: "nurse", detail: "Review triage queues, daily follow-up load, and next outreach actions." },
  { label: "Pharmacist dashboard", href: "/pharmacist", icon: "pharmacist", detail: "Track refill blockers, insurance issues, and medication continuity." },
  { label: "AI Enabled Feedback", href: "/feedback", icon: "spark", detail: "Turn page feedback into structured AI improvement prompts for the product team." }
];

function getVisibleNavItems(session: AuthenticatedSession | null) {
  if (!session) return navItems.filter((item) => item.id === "home");
  const allowed = new Set<Role>(["home", session.role, "feedback"]);
  return navItems.filter((item) => allowed.has(item.id));
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const positiveQuote = "Small steps today build safer recoveries tomorrow.";
const HOME_POSITIVE_MESSAGES = [
  positiveQuote,
  "Wellness is a journey we take together.",
  "Healing grows with support, consistency, and care.",
  "Every coordinated step helps the recovery journey move forward.",
  "Guided care and connected teams create calmer recoveries.",
  "A better tomorrow starts with clear support today.",
  "Compassion, clarity, and connection strengthen recovery.",
  "Steady support creates more confident care journeys."
] as const;

const HOME_RIBBON_BLOCKED_PATTERNS = [
  /\bpatient\b/i,
  /\bnurse\b/i,
  /\bpharmac/i,
  /\badmin\b/i,
  /\bdeveloper\b/i,
  /\brisk\b/i,
  /\bcritical\b/i,
  /\bbarrier\b/i,
  /\brefill\b/i,
  /\bappointment\b/i,
  /\bqueue\b/i,
  /\bstatus\b/i,
  /\bdischarge\b/i,
  /\bwatch closely\b/i,
  /\bhigh priority\b/i
] as const;
type IconName =
  | "heart"
  | "calendar"
  | "camera"
  | "pill"
  | "shield"
  | "stethoscope"
  | "pulse"
  | "message"
  | "home"
  | "login"
  | "admin"
  | "patient"
  | "nurse"
  | "pharmacist"
  | "developer"
  | "spark";

function shuffleMessages(values: string[]): string[] {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function approvedHomeRibbonMessages(values: readonly string[]): string[] {
  const approved = values.filter((value) => HOME_RIBBON_BLOCKED_PATTERNS.every((pattern) => !pattern.test(value.trim())));
  return approved.length > 0 ? [...approved] : [positiveQuote];
}

function useCurrentTime(): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return now;
}

function buildCalendarCells(date: Date): Array<{ key: string; label: string; active: boolean; muted: boolean }> {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ key: string; label: string; active: boolean; muted: boolean }> = [];

  for (let i = 0; i < firstDay; i += 1) {
    cells.push({ key: `empty-${i}`, label: "", active: false, muted: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ key: `day-${day}`, label: String(day), active: day === date.getDate(), muted: false });
  }

  return cells;
}

function formatDateTime(date: Date | null): { monthLabel: string; dateLabel: string; timeLabel: string } {
  if (!date) {
    return { monthLabel: "Calendar", dateLabel: "Loading date", timeLabel: "--:--" };
  }

  return {
    monthLabel: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    dateLabel: date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" }),
    timeLabel: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })
  };
}

function MedicalIcon({ name }: { name: IconName }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };

  if (name === "heart") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M12 20s-6.5-4.1-8.6-7.7A5 5 0 0 1 12 6a5 5 0 0 1 8.6 6.3C18.5 15.9 12 20 12 20Z" />
      </svg>
    );
  }
  if (name === "calendar") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect {...common} x="3" y="5" width="18" height="16" rx="3" />
        <path {...common} d="M8 3v4M16 3v4M3 10h18" />
      </svg>
    );
  }
  if (name === "camera") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M15 10.5 20 7v10l-5-3.5" />
        <rect {...common} x="3" y="6" width="12" height="12" rx="3" />
      </svg>
    );
  }
  if (name === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M3 11.5 12 4l9 7.5" />
        <path {...common} d="M6 10.5V20h12v-9.5" />
      </svg>
    );
  }
  if (name === "login") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M13 5h5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
        <path {...common} d="M4 12h11" />
        <path {...common} d="m11 7 4 5-4 5" />
      </svg>
    );
  }
  if (name === "admin") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle {...common} cx="12" cy="12" r="3.5" />
        <path {...common} d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 0 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 0 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 0 1 0 4h-.2a1 1 0 0 0-.9.6Z" />
      </svg>
    );
  }
  if (name === "patient") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle {...common} cx="12" cy="8" r="3.5" />
        <path {...common} d="M5.5 20a6.5 6.5 0 0 1 13 0" />
      </svg>
    );
  }
  if (name === "nurse") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M12 5v5" />
        <path {...common} d="M9.5 7.5h5" />
        <path {...common} d="M5 19c0-3.9 3.1-7 7-7s7 3.1 7 7" />
        <path {...common} d="M9 5.5h6" />
      </svg>
    );
  }
  if (name === "pharmacist") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect {...common} x="6" y="4.5" width="12" height="15" rx="2.5" />
        <path {...common} d="M9 8.5h6M9 12h6M9 15.5h4" />
        <path {...common} d="m15.5 4.5-1 3" />
      </svg>
    );
  }
  if (name === "developer") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="m8 8-4 4 4 4" />
        <path {...common} d="m16 8 4 4-4 4" />
        <path {...common} d="m13.5 5.5-3 13" />
      </svg>
    );
  }
  if (name === "pill") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M8 5a5 5 0 0 1 7.1 0l3.9 3.9a5 5 0 1 1-7.1 7.1L8 12.1A5 5 0 0 1 8 5Z" />
        <path {...common} d="m10 7 7 7" />
      </svg>
    );
  }
  if (name === "shield") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M12 3 5 6v5c0 5 3.1 8.4 7 10 3.9-1.6 7-5 7-10V6l-7-3Z" />
      </svg>
    );
  }
  if (name === "stethoscope") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M7 4v5a4 4 0 0 0 8 0V4M9 4h6M15 13v2a4 4 0 0 0 8 0v-1" />
        <circle {...common} cx="19" cy="14" r="2.5" />
      </svg>
    );
  }
  if (name === "pulse") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M3 12h4l2-4 4 9 2-5h6" />
      </svg>
    );
  }
  if (name === "spark") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="m12 3 1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3L12 3Z" />
        <path {...common} d="m18.5 14.5.9 2.3 2.3.9-2.3.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.3Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path {...common} d="M4 5h16v11H7l-3 3V5Z" />
      <path {...common} d="M8 9h8M8 13h5" />
    </svg>
  );
}

function badgeClass(risk: string): string {
  if (/high|urgent|critical|escal/i.test(risk)) return "ay-badge danger";
  if (/watch|pending|delay|hold/i.test(risk)) return "ay-badge warning";
  if (/routine|ready|stable|confirmed|on hand/i.test(risk)) return "ay-badge success";
  return "ay-badge info";
}

function StatCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="ay-stat">
      <label>{label}</label>
      <strong>{value}</strong>
      <span>{detail}</span>
    </div>
  );
}

function Card({ title, children, action, className }: { title?: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <section className={className ? `ay-card ${className}` : "ay-card"}>
      {title ? (
        <div className="ay-card-head">
          <h3>{title}</h3>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function RosterCard({ title, subtitle, tags, onClick }: { title: string; subtitle: string; tags: string[]; onClick: () => void }) {
  return (
    <button className="ay-roster-card" type="button" onClick={onClick}>
      <strong>{title}</strong>
      <span>{subtitle}</span>
      <div className="ay-tags">
        {tags.map((tag) => (
          <em key={tag}>{tag}</em>
        ))}
      </div>
    </button>
  );
}

function EntityModal({ selection, onClose }: { selection: EntitySelection; onClose: () => void }) {
  if (!selection) return null;
  const patient = selection.type === "patient" ? patients.find((item) => item.id === selection.id) : null;
  const nurse = selection.type === "nurse" ? nurses.find((item) => item.id === selection.id) : null;
  const pharmacist = selection.type === "pharmacist" ? pharmacists.find((item) => item.id === selection.id) : null;
  const title = patient?.name ?? nurse?.name ?? pharmacist?.name ?? "Care profile";
  const subtitle =
    patient
      ? `${patient.diagnosis}. Nurse ${patient.nurse}, pharmacist ${patient.pharmacist}.`
      : nurse
        ? `${nurse.specialty}. ${patientsForNurse(nurse.name).length} patients currently assigned.`
        : pharmacist
          ? `${pharmacist.focus}. ${pharmacist.fillsToday} medications filled today.`
          : "";
  const rows = patient
    ? [
        ["Risk", patient.risk],
        ["Medication", `${patient.medication} - ${patient.refillStatus}`],
        ["Barrier", patient.barrier],
        ["Next action", patient.nextAction]
      ]
    : nurse
      ? patientsForNurse(nurse.name).map((item) => [item.name, `${item.risk} - ${item.nextAction}`])
      : pharmacist
        ? patientsForPharmacist(pharmacist.name).map((item) => [item.name, `${item.medication} - ${item.refillStatus}`])
        : [];

  return (
    <div className="ay-modal" role="dialog" aria-modal="true">
      <div className="ay-modal-card">
        <button className="ay-close" type="button" onClick={onClose} aria-label="Close profile">
          x
        </button>
        <p className="ay-kicker">Priority profile</p>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <div className="ay-detail-list">
          {rows.map(([label, value]) => (
            <div key={`${label}-${value}`}>
              <strong>{label}</strong>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalendarPanel({ now }: { now: Date | null }) {
  const dateInfo = formatDateTime(now);
  const calendarCells = now ? buildCalendarCells(now) : [];

  return (
    <div className="ay-calendar-panel">
      <div className="ay-calendar-meta">
        <div>
          <p className="ay-kicker">Care calendar</p>
          <strong>{dateInfo.monthLabel}</strong>
          <span>{dateInfo.dateLabel}</span>
        </div>
        <div className="ay-icon-badge large">
          <MedicalIcon name="calendar" />
        </div>
      </div>
      <div className="ay-calendar ay-home-calendar">
        {WEEKDAYS.map((day) => <strong key={day}>{day}</strong>)}
        {calendarCells.map((cell) => <span key={cell.key} className={`${cell.active ? "active" : ""} ${cell.muted ? "muted" : ""}`}>{cell.label}</span>)}
      </div>
      <div className="ay-calendar-footer">
        <span>Today</span>
        <strong>{dateInfo.dateLabel}</strong>
        <span>{positiveQuote}</span>
      </div>
    </div>
  );
}

function WorkspaceCard({ icon, title, detail, href }: { icon: IconName; title: string; detail: string; href: string }) {
  return (
    <Link className="ay-workspace-card" href={href}>
      <div className="ay-workspace-card-head">
        <span className="ay-icon-badge large">
          <MedicalIcon name={icon} />
        </span>
        <strong>{title}</strong>
      </div>
      <p>{detail}</p>
      <span className="ay-workspace-link">Open workspace</span>
    </Link>
  );
}

function SupportPillar({ icon, title, detail }: { icon: IconName; title: string; detail: string }) {
  return (
    <article className="ay-support-pillar">
      <div className="ay-support-pillar-head">
        <span className="ay-icon-badge large">
          <MedicalIcon name={icon} />
        </span>
        <strong>{title}</strong>
      </div>
      <p>{detail}</p>
    </article>
  );
}

function formatMockLoginTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Recently active";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function SidebarAuth({
  role,
  initialSession,
  pendingAccess
}: {
  role: Role;
  initialSession: AuthenticatedSession | null;
  pendingAccess?: PendingAccessRequestContract | null;
}) {
  const [session, setSession] = useState<AuthenticatedSession | null>(initialSession);
  const [identifier, setIdentifier] = useState(initialSession?.email ?? "");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestAccessHref = "/feedback?sourceRole=home&requestAccess=1";

  useEffect(() => {
    setSession(initialSession);
    setIdentifier(initialSession?.email ?? "");
    setPassword("");
    setError(null);
  }, [initialSession, pendingAccess]);

  useEffect(() => {
    if (typeof window === "undefined" || initialSession) return;

    const authState = new URLSearchParams(window.location.search).get("auth");
    if (!authState) return;

    if (authState === "required") {
      setError("Sign in required to continue.");
      return;
    }
    if (authState === "google_unavailable") {
      setError("Google sign-in is not configured for this environment.");
      return;
    }
    if (authState === "google_denied") {
      setError("Google sign-in was cancelled.");
      return;
    }
    if (authState === "google_access_denied") {
      setError("This Google account is not provisioned for ArogyaYatra.");
      return;
    }
    if (authState === "google_failed") {
      setError("Unable to complete Google sign-in.");
    }
  }, [initialSession]);

  async function handleLogin() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password })
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; redirectTo?: string; session?: AuthenticatedSession }
        | null;

      if (!response.ok || !payload?.session || !payload.redirectTo) {
        setError(payload?.error ?? "Unable to sign in.");
        return;
      }

      setSession(payload.session);
      setPassword("");

      const redirectOverride = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirectTo") : null;
      window.location.assign(redirectOverride || payload.redirectTo);
    } catch {
      setError("Unable to sign in right now.");
    } finally {
      setPending(false);
    }
  }

  async function handleLogout() {
    setPending(true);
    setError(null);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setSession(null);
      setIdentifier("");
      setPassword("");
      window.location.assign("/");
    } catch {
      setError("Unable to sign out right now.");
    } finally {
      setPending(false);
    }
  }

  function handleGoogleLogin() {
    setPending(true);
    setError(null);

    const redirectOverride = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirectTo") : null;
    const search = new URLSearchParams();
    if (redirectOverride?.trim()) {
      search.set("redirectTo", redirectOverride);
    }
    const href = `/api/auth/google/start${search.toString() ? `?${search.toString()}` : ""}`;
    window.location.assign(href);
  }

  if (session) {
    const accountPath = session.role === "patient" ? `/patient/${session.linkedEntityId ?? ""}` : `/${session.role}`;
    return (
      <section className="ay-sidebar-auth-card ay-sidebar-account-card">
        <div className="ay-sidebar-auth-head">
          <span className="ay-icon-badge">
            <MedicalIcon name="shield" />
          </span>
          <div>
            <strong>Signed in</strong>
            <span>Authenticated role session</span>
          </div>
        </div>
        <div className="ay-sidebar-account-summary">
          <strong>{session.displayName}</strong>
          <span>{session.email}</span>
          <div className="ay-sidebar-account-meta">
            <em>{session.role}</em>
            <em>{session.scope.kind.replaceAll("_", " ")}</em>
          </div>
        </div>
        <div className="ay-sidebar-trust-box compact">
          <span className="ay-icon-badge">
            <MedicalIcon name="login" />
          </span>
          <div>
            <strong>Role-scoped access</strong>
            <span>{session.scope.summary}</span>
          </div>
        </div>
        <div className="ay-sidebar-session-row">
          <span>Last login</span>
          <strong>{formatMockLoginTime(session.lastLoginAt ?? session.issuedAt)}</strong>
        </div>
        <div className="ay-sidebar-auth-links footer">
          <Link href={accountPath}>Open my dashboard</Link>
          <button type="button" onClick={handleLogout} disabled={pending}>Sign out</button>
        </div>
        {error ? <p className="ay-inline-error">{error}</p> : null}
      </section>
    );
  }

  if (pendingAccess) {
    return (
      <section className="ay-sidebar-auth-card ay-sidebar-account-card">
        <div className="ay-sidebar-auth-head">
          <span className="ay-icon-badge">
            <MedicalIcon name="shield" />
          </span>
          <div>
            <strong>Access request in progress</strong>
            <span>
              {pendingAccess.status === "details_required"
                ? "Complete the patient information form on this page."
                : pendingAccess.status === "submitted"
                  ? "Application is under process."
                  : pendingAccess.status === "approved"
                    ? "Approval completed. Opening your dashboard."
                    : "This request needs follow-up with the care team."}
            </span>
          </div>
        </div>
        <div className="ay-sidebar-account-summary">
          <strong>{pendingAccess.displayName}</strong>
          <span>{pendingAccess.email}</span>
          <div className="ay-sidebar-account-meta">
            <em>{pendingAccess.desiredRole}</em>
            <em>{pendingAccess.provider}</em>
          </div>
        </div>
        <div className="ay-sidebar-trust-box compact">
          <span className="ay-icon-badge">
            <MedicalIcon name="patient" />
          </span>
          <div>
            <strong>Pending approval</strong>
            <span>
              {pendingAccess.status === "details_required"
                ? "Submit your patient information so Admin can review the request."
                : pendingAccess.status === "submitted"
                  ? "An Admin can approve this request or change the role before access is granted."
                  : "Role-based access is being finalized."}
            </span>
          </div>
        </div>
        <div className="ay-sidebar-auth-links footer">
          <span>Need another account?</span>
          <button type="button" onClick={handleLogout} disabled={pending}>Use a different sign-in</button>
        </div>
        {error ? <p className="ay-inline-error">{error}</p> : null}
      </section>
    );
  }

  return (
    <section className="ay-sidebar-auth-card">
      <div className="ay-sidebar-auth-head">
        <span className="ay-icon-badge">
          <MedicalIcon name="login" />
        </span>
        <div>
          <strong>Sign in to continue</strong>
          <span>Google sign-in comes first, with role-based demo access available below.</span>
        </div>
      </div>
      <button className="ay-social-button ay-social-primary" type="button" onClick={handleGoogleLogin} disabled={pending}>
        <span className="ay-social-mark google">G</span> Sign in with Google
      </button>
      <div className="ay-sidebar-divider"><span>or use role-based sign-in</span></div>
      <label className="ay-sidebar-field">
        <span>Email address</span>
        <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="you@example.com" />
      </label>
      <label className="ay-sidebar-field">
        <span>Password</span>
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
      </label>
      <div className="ay-sidebar-auth-links">
        <button type="button">Forgot password?</button>
        <span>Secure role-based access</span>
      </div>
      <button className="ay-sidebar-primary-button" type="button" onClick={handleLogin} disabled={pending || !identifier.trim() || !password.trim()}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
      <div className="ay-sidebar-socials">
        <button type="button" disabled><span className="ay-social-mark microsoft">M</span> Sign in with Microsoft</button>
        <button type="button" disabled><span className="ay-social-mark sso"><MedicalIcon name="shield" /></span> Sign in with SSO</button>
      </div>
      <div className="ay-sidebar-auth-links footer">
        <span>New to ArogyaYatra?</span>
        <Link href={requestAccessHref}>Request access</Link>
      </div>
      {error ? <p className="ay-inline-error">{error}</p> : null}
    </section>
  );
}

function CameraPrepCard({ patient, title }: { patient: Patient; title: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card title={title} action={<button className="ay-ghost-button" type="button" onClick={() => setOpen(true)}>Open pre-call</button>}>
        <div className="ay-camera-shell">
          <div className="ay-camera">
            <div className="ay-camera-media">
              <Image src="/camera-interface-reference.png" alt="Virtual consultation preview" fill sizes="(max-width: 820px) 100vw, 50vw" priority={false} />
            </div>
            <div className="ay-camera-overlay">
              <div className="ay-camera-badges">
                <span className="ay-inline-chip"><MedicalIcon name="camera" /> Video ready</span>
                <span className="ay-inline-chip"><MedicalIcon name="message" /> Audio check</span>
              </div>
              <div className="ay-camera-avatar">
                <MedicalIcon name="camera" />
              </div>
              <strong>{patient.name}</strong>
              <span>Preview camera and microphone before connecting to the care team.</span>
            </div>
          </div>
          <div className="ay-grid-3 compact">
            <StatCard label="Connection" value="Strong" detail="Private visit link ready" />
            <StatCard label="Audio" value="Checked" detail="Microphone and speaker test" />
            <StatCard label="Care team" value="Assigned" detail={patient.nurse} />
          </div>
        </div>
      </Card>

      {open ? (
        <div className="ay-modal" role="dialog" aria-modal="true">
          <div className="ay-precall-modal">
            <button className="ay-close" type="button" onClick={() => setOpen(false)} aria-label="Close pre-call interface">
              x
            </button>
            <div className="ay-precall-layout">
              <div className="ay-precall-preview">
                <div className="ay-precall-topbar">
                  <span className="ay-inline-chip"><MedicalIcon name="shield" /> Secure pre-call check</span>
                  <span className="ay-inline-chip"><MedicalIcon name="camera" /> {patient.appointment}</span>
                </div>
                <div className="ay-precall-video">
                  <div className="ay-precall-video-media">
                    <Image src="/camera-interface-reference.png" alt="Virtual consultation preview" fill sizes="(max-width: 820px) 100vw, 60vw" priority={false} />
                  </div>
                  <div className="ay-precall-video-overlay">
                    <div className="ay-camera-avatar large">
                      <MedicalIcon name="camera" />
                    </div>
                    <strong>{patient.name}</strong>
                    <span>Preview your video before joining the virtual visit.</span>
                  </div>
                </div>
                <div className="ay-precall-controls">
                  <button type="button"><MedicalIcon name="camera" /> Camera</button>
                  <button type="button"><MedicalIcon name="message" /> Mic</button>
                  <button type="button"><MedicalIcon name="shield" /> Settings</button>
                </div>
              </div>
              <div className="ay-precall-panel">
                <span className="ay-pill">Zoom-style pre-call</span>
                <h2>Check camera and audio before connecting</h2>
                <p>Use this screen to verify video, microphone, speaker output, and care-team readiness before entering the visit.</p>
                <div className="ay-precall-status-grid">
                  <div><strong>Camera</strong><span>Preview ready</span></div>
                  <div><strong>Audio</strong><span>Mic and speaker check available</span></div>
                  <div><strong>Visit type</strong><span>Secure virtual follow-up</span></div>
                  <div><strong>Assigned nurse</strong><span>{patient.nurse}</span></div>
                </div>
                <ul className="ay-list">
                  <li><strong>Step 1</strong><span>Confirm your face is centered in the preview.</span></li>
                  <li><strong>Step 2</strong><span>Check that your microphone icon shows audio is available.</span></li>
                  <li><strong>Step 3</strong><span>Join when your environment is quiet and well lit.</span></li>
                </ul>
                <div className="ay-precall-actions">
                  <button className="ay-secondary-button" type="button"><MedicalIcon name="camera" /> Check camera</button>
                  <button className="ay-secondary-button" type="button"><MedicalIcon name="message" /> Check audio</button>
                  <button className="ay-primary-button" type="button" onClick={() => setOpen(false)}><MedicalIcon name="stethoscope" /> Join care visit</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function DeveloperView({
  currentRole,
  currentPatient,
  sourceRoleFromQuery,
  patientIdFromQuery,
  requestAccessFromQuery,
  providerFromQuery
}: {
  currentRole: Role;
  currentPatient: Patient;
  sourceRoleFromQuery?: Role;
  patientIdFromQuery?: string;
  requestAccessFromQuery?: boolean;
  providerFromQuery?: string;
}) {
  const router = useRouter();
  const isRequestAccessMode = Boolean(requestAccessFromQuery);
  const accessProvider = providerFromQuery?.trim() || "manual";
  const providerLabel = providerFromQuery?.trim() ? `${providerFromQuery.trim()} sign-in` : "the public sign-in flow";
  const defaultSourceRole =
    sourceRoleFromQuery || (currentRole === "home" || currentRole === "developer" || currentRole === "feedback" ? "home" : currentRole);
  const [sourceRole, setSourceRole] = useState<Role>(defaultSourceRole);
  const [patientId, setPatientId] = useState(patientIdFromQuery || currentPatient.id);
  const [accessDisplayName, setAccessDisplayName] = useState("");
  const [accessEmail, setAccessEmail] = useState("");
  const [userType, setUserType] = useState("customer");
  const [aiGoal, setAiGoal] = useState("care coordination");
  const [feedback, setFeedback] = useState(() =>
    isRequestAccessMode
      ? "I tried to sign in, but my account is not yet provisioned for ArogyaYatra."
      : ""
  );
  const [desiredOutcome, setDesiredOutcome] = useState(() =>
    isRequestAccessMode
      ? "Route this access request to the product team and provision the correct role-based access for this user."
      : ""
  );
  const [constraints, setConstraints] = useState("Keep the feature calm, explainable, and safe for healthcare coordination.");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [contextSummary, setContextSummary] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedPatient = getPatientById(patientId);

  async function generatePrompt() {
    const trimmedFeedback = feedback.trim();
    const trimmedOutcome = desiredOutcome.trim();

    if (!trimmedFeedback || !trimmedOutcome) {
      setErrorMessage("Feedback and desired outcome are required before generating the prompt.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/developer-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceRole,
          patientId,
          userType,
          aiGoal,
          feedback: trimmedFeedback,
          desiredOutcome: trimmedOutcome,
          constraints
        })
      });
      const payload = (await response.json()) as { prompt?: string; contextSummary?: string; error?: string };
      if (!response.ok || !payload.prompt) {
        setErrorMessage(payload.error || "Prompt generation failed");
        return;
      }
      setGeneratedPrompt(payload.prompt);
      setContextSummary(payload.contextSummary || "");
      setErrorMessage("");
    } catch {
      setErrorMessage("Prompt generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function submitAccessRequest() {
    const trimmedName = accessDisplayName.trim();
    const trimmedEmail = accessEmail.trim().toLowerCase();
    const trimmedFeedback = feedback.trim();
    const trimmedOutcome = desiredOutcome.trim();

    if (!trimmedName || !trimmedEmail) {
      setErrorMessage("Name and email are required before preparing the access request.");
      return;
    }

    if (!trimmedFeedback) {
      setErrorMessage("Add a short explanation so the team understands why access is needed.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/auth/pending/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: trimmedName,
          email: trimmedEmail,
          provider: accessProvider,
          requestDetails: trimmedOutcome
            ? `${trimmedFeedback}\n\nRequested outcome: ${trimmedOutcome}`
            : trimmedFeedback
        })
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            request?: PendingAccessRequestContract;
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.request) {
        setErrorMessage(payload?.error || "Unable to create the access request right now.");
        return;
      }

      setGeneratedPrompt(
        [
          `Request ID: ${payload.request.id}`,
          `Name: ${payload.request.displayName}`,
          `Email: ${payload.request.email}`,
          `Initial role: ${payload.request.desiredRole}`,
          `Status: ${payload.request.status.replaceAll("_", " ")}`
        ].join("\n")
      );
      setContextSummary("Pending review");
      router.push("/");
      router.refresh();
    } catch {
      setErrorMessage("Unable to create the access request right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ay-board">
      <div className="ay-topbar">
        <div>
          <span className="ay-pill">{isRequestAccessMode ? "Request Access" : "AI Enabled Feedback"}</span>
          <h2>{isRequestAccessMode ? "Request access to ArogyaYatra" : "Capture feedback and shape safer AI features"}</h2>
          <p>
            {isRequestAccessMode
              ? `We couldn't match your ${providerLabel} to a provisioned ArogyaYatra account. Use this intake to capture the access request and the role the user should receive.`
              : "Capture feedback from any page, choose the end-user persona, and generate a ChatGPT-ready prompt for tailored AI features."}
          </p>
        </div>
      </div>
      <div className="ay-grid-2">
        <Card title={isRequestAccessMode ? "Access request intake" : "Feedback intake"}>
          <div className="ay-form-grid">
            {isRequestAccessMode ? (
              <>
                <div className="ay-form-feedback info" role="status">
                  New users start as pending patient access so the team can review the request before opening a dashboard.
                </div>
                <label className="ay-field">
                  <span>Full name</span>
                  <input
                    value={accessDisplayName}
                    onChange={(event) => {
                      setAccessDisplayName(event.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    placeholder="Enter the user's full name"
                  />
                </label>
                <label className="ay-field">
                  <span>Email address</span>
                  <input
                    type="email"
                    value={accessEmail}
                    onChange={(event) => {
                      setAccessEmail(event.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    placeholder="Enter the email used for sign-in"
                  />
                </label>
                <label className="ay-field">
                  <span>Source page</span>
                  <select value={sourceRole} onChange={(event) => setSourceRole(event.target.value as Role)}>
                    {navItems.filter((item) => item.id !== "developer" && item.id !== "feedback").map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>
                <label className="ay-field">
                  <span>Initial role</span>
                  <input value="patient" readOnly />
                </label>
                <label className="ay-field full">
                  <span>Access request details</span>
                  <textarea
                    value={feedback}
                    onChange={(event) => {
                      setFeedback(event.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    placeholder="Describe why access is needed and what the user was trying to do."
                    rows={5}
                  />
                </label>
                <label className="ay-field full">
                  <span>What should happen next?</span>
                  <textarea
                    value={desiredOutcome}
                    onChange={(event) => {
                      setDesiredOutcome(event.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    placeholder="Describe any role or workflow outcome the admin team should consider."
                    rows={4}
                  />
                </label>
                <div className="ay-form-actions">
                  <button className="ay-primary-button" type="button" onClick={() => void submitAccessRequest()}>
                    {loading ? "Submitting..." : "Prepare access request"}
                  </button>
                </div>
                {errorMessage ? <p className="ay-form-feedback" role="alert">{errorMessage}</p> : null}
              </>
            ) : (
              <>
                <label className="ay-field">
                  <span>Source page</span>
                  <select value={sourceRole} onChange={(event) => setSourceRole(event.target.value as Role)}>
                    {navItems.filter((item) => item.id !== "developer" && item.id !== "feedback").map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>
                <label className="ay-field">
                  <span>End user</span>
                  <select value={userType} onChange={(event) => setUserType(event.target.value)}>
                    {["customer", "patient", "nurse", "pharmacist", "admin", "caregiver", "developer"].map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label className="ay-field">
                  <span>Patient context</span>
                  <select value={patientId} onChange={(event) => setPatientId(event.target.value)}>
                    {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
                  </select>
                </label>
                <label className="ay-field">
                  <span>AI goal</span>
                  <select value={aiGoal} onChange={(event) => setAiGoal(event.target.value)}>
                    {["care coordination", "personalized guidance", "workflow automation", "history summarization", "medication support", "virtual visit support", "custom"].map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label className="ay-field full">
                  <span>Feedback from the current page</span>
                  <textarea
                    value={feedback}
                    onChange={(event) => {
                      setFeedback(event.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    placeholder="Describe the pain point, missing AI behavior, or workflow gap."
                    rows={5}
                  />
                </label>
                <label className="ay-field full">
                  <span>Desired outcome</span>
                  <textarea
                    value={desiredOutcome}
                    onChange={(event) => {
                      setDesiredOutcome(event.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    placeholder="Describe what the app should do for this end user."
                    rows={4}
                  />
                </label>
                <label className="ay-field full">
                  <span>Constraints</span>
                  <textarea value={constraints} onChange={(event) => setConstraints(event.target.value)} rows={3} />
                </label>
                <div className="ay-form-actions">
                  <button className="ay-primary-button" type="button" onClick={() => void generatePrompt()}>
                    {loading ? "Generating..." : "Generate ChatGPT prompt"}
                  </button>
                </div>
                {errorMessage ? <p className="ay-form-feedback" role="alert">{errorMessage}</p> : null}
              </>
            )}
          </div>
        </Card>
        <Card title={isRequestAccessMode ? "What happens next" : "Context snapshot"}>
          {isRequestAccessMode ? (
            <div className="ay-developer-summary">
              <div className="ay-detail-list">
                <div><strong>Provider</strong><span>{accessProvider}</span></div>
                <div><strong>Requested route</strong><span>{sourceRole}</span></div>
                <div><strong>Initial role</strong><span>patient</span></div>
                <div><strong>Admin action</strong><span>Approve directly or open details and change the role before approval.</span></div>
              </div>
              <ul className="ay-list">
                <li><strong>1. Create pending request</strong><span>The request is saved to the approvals queue.</span></li>
                <li><strong>2. Complete patient information</strong><span>The landing page will collect the onboarding details needed for review.</span></li>
                <li><strong>3. Wait for admin approval</strong><span>Once approved, the user's dashboard becomes visible.</span></li>
              </ul>
            </div>
          ) : (
            <div className="ay-developer-summary">
              <div className="ay-detail-list">
                <div><strong>Source page</strong><span>{sourceRole}</span></div>
                <div><strong>Selected patient</strong><span>{selectedPatient.name} - {selectedPatient.diagnosis}</span></div>
                <div><strong>Care team</strong><span>{selectedPatient.nurse}; {selectedPatient.pharmacist}</span></div>
                <div><strong>Current barrier</strong><span>{selectedPatient.barrier}</span></div>
              </div>
              <div className="ay-agent-grid">
                {agentCapabilities.map((agent) => (
                  <div key={agent.name} className="ay-agent-card">
                    <strong>{agent.name}</strong>
                    <span>{agent.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
      <Card title={isRequestAccessMode ? "Generated access request" : "Generated prompt"} action={contextSummary ? <span className="ay-badge info">{contextSummary}</span> : null}>
        <div className="ay-prompt-preview">
          <textarea
            value={generatedPrompt}
            readOnly
            placeholder={
              isRequestAccessMode
                ? "Prepare a structured access request summary for the product team."
                : "Generate a prompt to create a ChatGPT-ready AI feature brief from this page feedback."
            }
            rows={18}
          />
        </div>
      </Card>
    </div>
  );
}

function DeveloperConsoleView() {
  const developer = developers[0];
  const agentNodes = [
    { name: "Planner Agent", status: "Healthy", time: "120 ms", tone: "success" },
    { name: "Context Agent", status: "Healthy", time: "98 ms", tone: "success" },
    { name: "Patient Agent", status: "Healthy", time: "110 ms", tone: "success" },
    { name: "Pharmacy Agent", status: "Warning", time: "320 ms", tone: "warning" },
    { name: "Monitoring Agent", status: "Healthy", time: "95 ms", tone: "success" },
    { name: "Policy Engine", status: "Healthy", time: "80 ms", tone: "success" },
    { name: "Reviewer Agent", status: "Approved", time: "210 ms", tone: "info" },
    { name: "Action Executor", status: "Completed", time: "140 ms", tone: "success" }
  ] as const;
  const recentTraces = [
    ["req_12345", "Sunita Devi (Nurse)", "Completed", "1.02s", "10:32:15 AM"],
    ["req_12344", "Ramesh Kumar (Patient)", "Completed", "0.89s", "10:31:58 AM"],
    ["req_12342", "Anita Verma (Nurse)", "Completed", "0.76s", "10:31:33 AM"],
    ["req_12341", "Mohammed Ali (Patient)", "Warning", "2.34s", "10:31:21 AM"]
  ];
  const liveEvents = [
    ["10:32:19 AM", "Action Executor", "Action Completed", "Info", "Medication review escalated and task created"],
    ["10:32:18 AM", "Reviewer Agent", "Review Approved", "Info", "Reviewer approved the recommended action"],
    ["10:32:17 AM", "Policy Engine", "Policy Check", "Info", "High risk detected. Escalation required."],
    ["10:32:16 AM", "Pharmacy Agent", "Drug Interaction", "Warning", "High-risk interaction found: Furosemide + NSAIDs"]
  ];

  return (
    <div className="ay-board ay-dev-board">
      <div className="ay-dev-toolbar">
        <div className="ay-dev-search">
          <MedicalIcon name="message" />
          <input value="Search agents, traces, tools..." readOnly aria-label="Developer search" />
          <span>K</span>
        </div>
        <div className="ay-dev-toolbar-meta">
          <span className="ay-dev-status"><i /> All Systems Operational</span>
          <button type="button" className="ay-ghost-button">API Docs</button>
          <button type="button" className="ay-secondary-button">{developer.name}</button>
        </div>
      </div>
      <div className="ay-topbar">
        <div>
          <span className="ay-pill">Developer board</span>
          <h2>Multi-Agent Overview</h2>
          <p>Observe, test, and debug AI-powered care coordination with a mock developer console built for the ArogyaYatra agentic runtime.</p>
        </div>
        <div className="ay-dev-toolbar-meta">
          <button type="button" className="ay-secondary-button">Last 1 hour</button>
          <button type="button" className="ay-ghost-button">Auto refresh</button>
        </div>
      </div>
      <div className="ay-kpis ay-dev-kpis">
        <StatCard label="Total requests" value="12.4K" detail="12.5% up vs last hour" />
        <StatCard label="Success rate" value="99.62%" detail="0.8% up vs last hour" />
        <StatCard label="Avg. latency" value="142 ms" detail="8.6% down vs last hour" />
        <StatCard label="Active agents" value="8 / 9" detail="1 new activation" />
        <StatCard label="Guardrail blocks" value="32" detail="4 less than last hour" />
        <StatCard label="Cost (est.)" value="$18.62" detail="9.2% down vs last hour" />
      </div>
      <div className="ay-dev-layout">
        <div className="ay-dev-main">
          <Card title="Agent execution graph" action={<span className="ay-badge success">Live</span>}>
            <div className="ay-dev-graph">
              <div className="ay-dev-graph-lane">
                <div className="ay-dev-node static">
                  <strong>User / System</strong>
                  <span>Request ID req_12345</span>
                </div>
                <div className="ay-dev-node success">
                  <strong>Planner Agent</strong>
                  <span>Healthy - 120 ms</span>
                </div>
                <div className="ay-dev-node-stack">
                  {agentNodes.slice(1, 5).map((node) => (
                    <div key={node.name} className={`ay-dev-node ${node.tone.toLowerCase()}`}>
                      <strong>{node.name}</strong>
                      <span>{node.status} - {node.time}</span>
                    </div>
                  ))}
                </div>
                {agentNodes.slice(5).map((node) => (
                  <div key={node.name} className={`ay-dev-node ${node.tone.toLowerCase()}`}>
                    <strong>{node.name}</strong>
                    <span>{node.status} - {node.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <div className="ay-dev-grid-2">
            <Card title="Agent status" action={<span className="ay-badge success">Live</span>}>
              <table className="ay-table">
                <tbody>
                  {agentNodes.map((node, index) => (
                    <tr key={node.name}>
                      <td>{node.name}</td>
                      <td><span className={badgeClass(node.status)}>{node.status}</span></td>
                      <td>{(1200 - index * 40) / 1000}K</td>
                      <td>{node.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Card title="Recent traces" action={<button type="button" className="ay-ghost-button">View all</button>}>
              <table className="ay-table">
                <tbody>
                  {recentTraces.map(([id, source, status, duration, time]) => (
                    <tr key={id}>
                      <td>{id}</td>
                      <td>{source}</td>
                      <td><span className={badgeClass(status)}>{status}</span></td>
                      <td>{duration}</td>
                      <td>{time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
          <Card title="Live events stream" action={<span className="ay-badge success">Live</span>}>
            <table className="ay-table">
              <tbody>
                {liveEvents.map(([time, agent, eventType, level, message]) => (
                  <tr key={`${time}-${agent}`}>
                    <td>{time}</td>
                    <td>{agent}</td>
                    <td>{eventType}</td>
                    <td><span className={badgeClass(level)}>{level}</span></td>
                    <td>{message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
        <div className="ay-dev-side">
          <Card title="Trace inspector" action={<button type="button" className="ay-ghost-button">View full trace</button>}>
            <div className="ay-detail-list">
              <div><strong>Request ID</strong><span>req_12345</span></div>
              <div><strong>Initiated by</strong><span>Nurse (Sunita Devi)</span></div>
              <div><strong>User intent</strong><span>Check medication interaction and escalate if high risk</span></div>
            </div>
            <ul className="ay-list">
              {agentNodes.map((node) => (
                <li key={node.name}><strong>{node.name}</strong><span>{node.status} - {node.time}</span></li>
              ))}
            </ul>
          </Card>
          <Card title="Prompt & tool inspector">
            <div className="ay-detail-list">
              <div><strong>Prompt</strong><span>Healthcare coordinator with policy-aware escalation.</span></div>
              <div><strong>Tools</strong><span>3 active tools in this trace</span></div>
              <div><strong>Model</strong><span>gpt-4o mock runtime</span></div>
            </div>
          </Card>
          <Card title="Quick actions">
            <div className="ay-actions">
              <button className="ay-secondary-button" type="button">Test run</button>
              <button className="ay-secondary-button" type="button">New prompt</button>
              <button className="ay-primary-button" type="button">Add agent</button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Assistant({ role, patient, session }: { role: Role; patient: Patient; session: AuthenticatedSession | null }) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("Ask for page-specific guidance, medication history, workload, or refill blockers.");
  const [loading, setLoading] = useState(false);
  const title =
    role === "home"
      ? "Home assistant"
      : role === "admin"
        ? "Admin assistant"
        : role === "patient"
          ? "Patient assistant"
          : role === "nurse"
            ? "Nurse assistant"
            : role === "pharmacist"
              ? "Pharmacy assistant"
              : role === "feedback"
                ? "AI feedback assistant"
              : "Developer assistant";
  const assistantEnabled = Boolean(session) && role !== "home" && role !== "feedback" && role !== "developer";

  useEffect(() => {
    if (assistantEnabled) {
      setAnswer("Ask for page-specific guidance, medication history, workload, or refill blockers.");
      return;
    }

    if (role === "developer") {
      setAnswer("Developer access uses the observability console, traces, guardrails, and review tooling instead of the patient-care chat endpoint.");
      return;
    }

    if (role === "feedback") {
      setAnswer("Use AI Enabled Feedback to capture workflow issues and generate structured improvement prompts.");
      return;
    }

    setAnswer("Sign in and open an authorized care dashboard to use the care assistant.");
  }, [assistantEnabled, role]);

  async function respond(text: string) {
    const cleaned = text.trim();
    if (!cleaned || !assistantEnabled) return;
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patient.id, question: cleaned })
      });
      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(failure?.error ?? "Chat route failed");
      }
      const payload = (await response.json()) as {
        answer: string;
        agentsUsed?: string[];
        safeNextActions?: string[];
        escalationRequired?: boolean;
      };
      const details = [
        payload.agentsUsed?.length ? `Agents used: ${payload.agentsUsed.join(", ")}.` : "",
        payload.safeNextActions?.length ? `Next: ${payload.safeNextActions.join(" ")}` : "",
        payload.escalationRequired ? "Escalation required." : ""
      ]
        .filter(Boolean)
        .join(" ");
      setAnswer(`${payload.answer}${details ? ` ${details}` : ""}`);
    } catch (error) {
      setAnswer(error instanceof Error ? error.message : "Unable to reach the assistant right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="ay-chat">
      <div className="ay-chat-head">
        <strong>{title}</strong>
        <span>{assistantEnabled ? "Session-scoped assistant" : "Protected helper panel"}</span>
      </div>
      <div className="ay-chat-answer">{answer}</div>
      <div className="ay-chat-suggestions">
        {["What should I review first?", "Show medication history", "Explain current blockers"].map((item) => (
          <button key={item} type="button" onClick={() => void respond(item)} disabled={!assistantEnabled}>
            {item}
          </button>
        ))}
      </div>
      <form
        className="ay-chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          void respond(query);
        }}
      >
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={assistantEnabled ? "Ask about this page" : "Sign in to enable assistant access"} disabled={!assistantEnabled} />
        <button type="submit" disabled={!assistantEnabled}>{loading ? "..." : "Ask"}</button>
      </form>
    </aside>
  );
}

function AdminView({
  onSelect,
  pendingApprovals
}: {
  onSelect: (selection: EntitySelection) => void;
  pendingApprovals: PendingAccessRequestContract[];
}) {
  const [showPendingApprovals, setShowPendingApprovals] = useState(false);
  const [approvals, setApprovals] = useState(pendingApprovals);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const now = useCurrentTime();
  const dateInfo = formatDateTime(now);
  const calendarCells = now ? buildCalendarCells(now) : [];
  const riskCount = patients.filter((patient) => patient.risk !== "Routine").length;
  const totalMessages = patients.reduce((sum, patient) => sum + patient.messages, 0);
  const todaysAppointments = patients.filter((patient) => patient.appointment.startsWith("Today")).length;
  const topPatients = priorityPatients().slice(0, 3);
  const topNurses = priorityNurses().slice(0, 3);
  const topPharmacists = priorityPharmacists().slice(0, 3);

  useEffect(() => {
    setApprovals(pendingApprovals);
  }, [pendingApprovals]);

  useEffect(() => {
    if (!showPendingApprovals) return;

    let cancelled = false;

    async function refreshPendingApprovals() {
      setApprovalsLoading(true);
      try {
        const response = await fetch("/api/admin/pending-approvals", {
          method: "GET",
          cache: "no-store"
        });
        const payload = (await response.json().catch(() => null)) as { requests?: PendingAccessRequestContract[] } | null;
        if (!response.ok || !payload?.requests || cancelled) {
          return;
        }
        setApprovals(payload.requests);
      } finally {
        if (!cancelled) {
          setApprovalsLoading(false);
        }
      }
    }

    void refreshPendingApprovals();
    const timer = window.setInterval(() => {
      void refreshPendingApprovals();
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [showPendingApprovals]);

  return (
    <div className="ay-board">
      <div className="ay-topbar">
        <div>
          <span className="ay-pill">Admin dashboard</span>
          <h2>Operational overview</h2>
          <p>ArogyaYatra combines care-team workload, appointments, patient risk, and refill pressure into one coded command surface.</p>
        </div>
        <div className="ay-topbar-actions">
          <button
            type="button"
            className="ay-ghost-button ay-count-button"
            onClick={() => setShowPendingApprovals((value) => !value)}
            aria-expanded={showPendingApprovals}
            aria-controls="pending-approvals-panel"
          >
            <span>Pending approvals</span>
            <em>{approvalsLoading ? "..." : approvals.length}</em>
          </button>
        </div>
      </div>
      <div className="ay-kpis">
        <StatCard label="Total patients" value={patients.length} detail={`${riskCount} need active monitoring`} />
        <StatCard label="Today's appointments" value={todaysAppointments} detail={dateInfo.dateLabel} />
        <StatCard label="Pending consultations" value={riskCount} detail="Derived from patient risk levels" />
        <StatCard label="Unread messages" value={totalMessages} detail="Patient and care-team follow-ups" />
      </div>
      <Card title="Priority coordination roster">
        <div className="ay-roster-band">
          <div>
            <p className="ay-kicker">Top patients</p>
            <div className="ay-roster-row">
              {topPatients.map((patient) => (
                <RosterCard
                  key={patient.id}
                  title={patient.name}
                  subtitle={`${patient.id} - ${patient.diagnosis}`}
                  tags={[patient.risk, `${patient.dischargeHoursAgo}h discharge`, patient.critical ? "critical" : "monitor"]}
                  onClick={() => onSelect({ type: "patient", id: patient.id })}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="ay-kicker">Top nurses</p>
            <div className="ay-roster-row">
              {topNurses.map((nurse) => (
                <RosterCard
                  key={nurse.id}
                  title={nurse.name}
                  subtitle={`${nurse.id} - ${nurse.specialty}`}
                  tags={[`${patientsForNurse(nurse.name).length} patients`, `${nurse.responseMinutes}m response`, nurse.shift]}
                  onClick={() => onSelect({ type: "nurse", id: nurse.id })}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="ay-kicker">Top pharmacists</p>
            <div className="ay-roster-row">
              {topPharmacists.map((pharmacist) => (
                <RosterCard
                  key={pharmacist.id}
                  title={pharmacist.name}
                  subtitle={`${pharmacist.id} - ${pharmacist.focus}`}
                  tags={[`${pharmacist.queueSize} queue`, `${pharmacist.fillsToday} fills`, `${patientsForPharmacist(pharmacist.name).length} linked`]}
                  onClick={() => onSelect({ type: "pharmacist", id: pharmacist.id })}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>
      {showPendingApprovals ? <PendingApprovalsCard approvals={approvals} setApprovals={setApprovals} isRefreshing={approvalsLoading} /> : null}
      <div className="ay-admin-grid">
        <Card title="Appointments overview">
          <div className="ay-bars">{["42", "68", "78", "88", "82", "96", "70"].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div>
          <div className="ay-axis"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
        </Card>
        <Card title="Care calendar" action={<span className="ay-badge info">{dateInfo.monthLabel}</span>}>
          <div className="ay-calendar">
            {WEEKDAYS.map((day) => <strong key={day}>{day}</strong>)}
            {calendarCells.map((cell) => <span key={cell.key} className={`${cell.active ? "active" : ""} ${cell.muted ? "muted" : ""}`}>{cell.label}</span>)}
          </div>
        </Card>
        <Card title="Upcoming tasks">
          <ul className="ay-list">
            {priorityPatients().slice(0, 4).map((patient) => <li key={patient.id}><strong>{patient.nextAction}</strong><span>{patient.name}</span></li>)}
          </ul>
        </Card>
        <Card title="Today's appointments">
          <table className="ay-table">
            <tbody>
              {patients.slice(0, 6).map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.appointment.split(" ")[1] ?? "Today"}</td>
                  <td>{patient.name}</td>
                  <td>{patient.diagnosis}</td>
                  <td><span className={badgeClass(patient.risk)}>{patient.risk}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function PendingApprovalsCard({
  approvals,
  setApprovals,
  isRefreshing
}: {
  approvals: PendingAccessRequestContract[];
  setApprovals: Dispatch<SetStateAction<PendingAccessRequestContract[]>>;
  isRefreshing: boolean;
}) {
  const [selectedRoles, setSelectedRoles] = useState<Record<string, Role>>(
    Object.fromEntries(approvals.map((request) => [request.id, request.desiredRole]))
  );
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSelectedRoles(Object.fromEntries(approvals.map((request) => [request.id, request.desiredRole])));
    setExpandedRequestId(null);
  }, [approvals]);

  async function handleApprove(requestId: string) {
    const approvedRole = selectedRoles[requestId];
    if (!approvedRole || approvedRole === "home" || approvedRole === "feedback") return;

    setPendingId(requestId);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/pending-approvals/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedRole })
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(payload?.error ?? "Unable to approve this request.");
        return;
      }

      setApprovals((current) => current.filter((request) => request.id !== requestId));
      setMessage("Pending access approved.");
    } catch {
      setMessage("Unable to approve this request right now.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card
      title="Pending approvals"
      className="ay-pending-approvals-card"
      action={<span className="ay-badge info">{isRefreshing ? "Refreshing..." : `${approvals.length} waiting`}</span>}
    >
      <div id="pending-approvals-panel" className="ay-pending-approvals">
        {approvals.length === 0 ? (
          <div className="ay-empty-state">
            <strong>No pending approvals right now.</strong>
            <span>New request-access submissions and Google onboarding requests will appear here after users enter their details.</span>
          </div>
        ) : (
          approvals.map((request) => (
            <article key={request.id} className="ay-pending-approval-row">
              <div className="ay-pending-approval-copy">
                <strong>{request.displayName}</strong>
                <span>{request.email}</span>
                <div className="ay-sidebar-account-meta">
                  <em>{request.provider}</em>
                  <em>{request.status.replaceAll("_", " ")}</em>
                  <em>{request.desiredRole}</em>
                </div>
                <p>
                  Diagnosis: {request.diagnosisSummary || "Not submitted yet"} | Discharge site: {request.dischargeFacility || "Waiting on form"}
                </p>
                <small>Request notes: {request.approvalNotes || "No additional notes submitted yet."}</small>
                <small>
                  Emergency contact: {request.emergencyContactName || "Pending"} {request.emergencyContactPhone ? `(${request.emergencyContactPhone})` : ""}
                </small>
                {expandedRequestId === request.id ? (
                  <div className="ay-pending-approval-detail">
                    <div className="ay-detail-list">
                      <div>
                        <strong>Phone</strong>
                        <span>{request.phone || "Pending"}</span>
                      </div>
                      <div>
                        <strong>Date of birth</strong>
                        <span>{request.dateOfBirth || "Pending"}</span>
                      </div>
                      <div>
                        <strong>Address</strong>
                        <span>{request.addressLine || "Pending"}</span>
                      </div>
                      <div>
                        <strong>Submitted</strong>
                        <span>{request.submittedAt ? formatMockLoginTime(request.submittedAt) : "Waiting on form completion"}</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="ay-pending-approval-actions">
                <label className="ay-field">
                  <span>Approved role</span>
                  <select
                    value={selectedRoles[request.id] ?? request.desiredRole}
                    onChange={(event) =>
                      setSelectedRoles((current) => ({
                        ...current,
                        [request.id]: event.target.value as Role
                      }))
                    }
                  >
                    {(["patient", "nurse", "pharmacist", "admin", "developer"] as const).map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="ay-pending-approval-button-row">
                  <button
                    type="button"
                    className="ay-secondary-button"
                    onClick={() => setExpandedRequestId((current) => (current === request.id ? null : request.id))}
                  >
                    {expandedRequestId === request.id ? "Hide details" : "View details"}
                  </button>
                  <button
                    type="button"
                    className="ay-primary-button"
                    onClick={() => void handleApprove(request.id)}
                    disabled={pendingId === request.id}
                  >
                    {pendingId === request.id ? "Approving..." : "Approve directly"}
                  </button>
                </div>
                {expandedRequestId === request.id ? (
                  <button
                    type="button"
                    className="ay-primary-button"
                    onClick={() => void handleApprove(request.id)}
                    disabled={pendingId === request.id}
                  >
                    {pendingId === request.id ? "Approving..." : "Approve with selected role"}
                  </button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
      {message ? <p className="ay-form-feedback info">{message}</p> : null}
    </Card>
  );
}

type JourneyStep = {
  name: string;
  status: "Completed" | "In Progress" | "Attention" | "Upcoming";
  detail: string;
  meta: string;
  icon: IconName;
};

function journeyStepTone(status: JourneyStep["status"]): "success" | "info" | "warning" {
  if (status === "Completed") return "success";
  if (status === "Attention") return "warning";
  return "info";
}

function JourneyLegend() {
  const items: Array<{ label: string; tone: "success" | "info" | "warning" | "muted" }> = [
    { label: "Completed", tone: "success" },
    { label: "In Progress", tone: "info" },
    { label: "Attention", tone: "warning" },
    { label: "Upcoming", tone: "muted" }
  ];

  return (
    <div className="ay-journey-legend">
      {items.map((item) => (
        <span key={item.label} className={`ay-journey-legend-item ${item.tone}`}>
          <i />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function JourneyStrip({ stages }: { stages: JourneyStep[] }) {
  return (
    <div className="ay-journey-strip">
      {stages.map((stage, index) => (
        <article key={stage.name} className={`ay-journey-stage ${journeyStepTone(stage.status).toLowerCase()} ${stage.status === "In Progress" ? "current" : ""}`}>
          <div className="ay-journey-stage-top">
            <span className={`ay-journey-stage-dot ${journeyStepTone(stage.status).toLowerCase()}`} />
            <span className="ay-icon-badge large">
              <MedicalIcon name={stage.icon} />
            </span>
          </div>
          <strong>{stage.name}</strong>
          <em className={`ay-badge ${badgeClass(stage.status)}`}>{stage.status}</em>
          <span>{stage.detail}</span>
          <small>{stage.meta}</small>
          {index < stages.length - 1 ? <div className="ay-journey-stage-link" aria-hidden="true"><span>&rarr;</span></div> : null}
        </article>
      ))}
    </div>
  );
}

function AlertStack({ title, items }: { title: string; items: Array<{ label: string; detail: string; tone: "danger" | "warning" | "info" }> }) {
  return (
    <Card title={title}>
      <div className="ay-alert-stack">
        {items.map((item) => (
          <button key={`${item.label}-${item.detail}`} type="button" className={`ay-alert-item ${item.tone}`}>
            <div>
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
            </div>
            <em>&rarr;</em>
          </button>
        ))}
      </div>
    </Card>
  );
}

function ActionStack({ title, items }: { title: string; items: string[] }) {
  return (
    <Card title={title}>
      <div className="ay-action-stack">
        {items.map((item) => (
          <button key={item} type="button" className="ay-action-row">
            <span>{item}</span>
            <em>&rarr;</em>
          </button>
        ))}
      </div>
    </Card>
  );
}

function TimelineCard({ title, items }: { title: string; items: Array<{ label: string; detail: string; meta: string; icon: IconName }> }) {
  return (
    <Card title={title} action={<button type="button" className="ay-ghost-button">View all activity</button>}>
      <div className="ay-timeline">
        {items.map((item) => (
          <div key={`${item.label}-${item.meta}`} className="ay-timeline-item">
            <span className="ay-timeline-icon">
              <MedicalIcon name={item.icon} />
            </span>
            <div>
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
              <small>{item.meta}</small>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TeamCard({ patient }: { patient: Patient }) {
  const physicianName = patient.id === "PT-1001" ? "Rahul Verma" : patient.id === "PT-1002" ? "Aisha Khan" : "Leena Joseph";

  return (
    <Card title="Care team" action={<button type="button" className="ay-ghost-button">View all</button>}>
      <div className="ay-team-list">
        {[
          { name: patient.nurse, role: "Primary Nurse", icon: "nurse" as const },
          { name: physicianName, role: "Primary Physician", icon: "stethoscope" as const },
          { name: patient.pharmacist, role: "Pharmacist", icon: "pharmacist" as const }
        ].map((member) => (
          <div key={member.name} className="ay-team-member">
            <span className="ay-icon-badge large">
              <MedicalIcon name={member.icon} />
            </span>
            <div>
              <strong>{member.name}</strong>
              <span>{member.role}</span>
            </div>
            <em>Online</em>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PatientView({ patient }: { patient: Patient }) {
  const riskLabel = patient.risk === "High priority" ? "High Risk" : patient.risk === "Watch closely" ? "Medium Risk" : "Stable";
  const riskScore = patient.risk === "High priority" ? 0.82 : patient.risk === "Watch closely" ? 0.64 : 0.28;
  const patientStages: JourneyStep[] = [
    { name: "Intake", status: "Completed", detail: "Completed on 12 Apr, 10:32 AM", meta: "Documents and onboarding complete", icon: "calendar" },
    { name: "Assessment", status: patient.journeyStage === "Assessment" || patient.journeyStage === "Monitoring" ? "In Progress" : "Completed", detail: "Current focus", meta: "AI-assisted review of current condition", icon: "heart" },
    { name: "Treatment", status: patient.risk === "High priority" || !/on hand/i.test(patient.refillStatus) ? "Attention" : patient.journeyStage === "Treatment" ? "In Progress" : "Upcoming", detail: patient.barrier, meta: patient.refillStatus, icon: "pill" },
    { name: "Monitoring", status: patient.journeyStage === "Monitoring" ? "In Progress" : patient.journeyStage === "Recovery" ? "Completed" : "Upcoming", detail: "First reading scheduled", meta: patient.appointment, icon: "pulse" },
    { name: "Recovery", status: patient.journeyStage === "Recovery" ? "In Progress" : "Upcoming", detail: "Follow-up visit planned", meta: "Continue guided wellness support", icon: "shield" }
  ];
  const patientTimeline = [
    { label: "Intake completed", detail: "All documents received", meta: "12 Apr - 10:32 AM", icon: "calendar" as const },
    { label: "Vitals received", detail: "Data from device synced", meta: "12 Apr - 11:00 AM", icon: "pulse" as const },
    { label: "AI risk flagged", detail: `${riskLabel} detected from current signals`, meta: "12 Apr - 11:05 AM", icon: "spark" as const },
    { label: "Nurse notified", detail: "Review in progress", meta: "12 Apr - 11:10 AM", icon: "nurse" as const },
    { label: "Next check", detail: "Follow-up visit scheduled", meta: patient.appointment, icon: "camera" as const }
  ];

  return (
    <div className="ay-board ay-journey-board">
      <div className="ay-topbar">
        <div>
          <span className="ay-pill">Patient care journey</span>
          <h2>Hello, {patient.name.split(" ")[0]}.</h2>
          <p>Real-time overview of care progress, AI insights, and clinical updates for {patient.diagnosis.toLowerCase()}.</p>
        </div>
        <JourneyLegend />
      </div>
      <JourneyStrip stages={patientStages} />
      <div className="ay-journey-content patient">
        <Card title="Current stage">
          <div className="ay-stage-summary">
            <div>
              <strong>{patient.journeyStage}</strong>
              <em className="ay-pill">AI Enabled</em>
            </div>
            <p>AI-assisted evaluation of patient condition using live vitals, history, discharge data, and medication continuity signals.</p>
            <div className="ay-risk-score">
              <label>AI Risk Score</label>
              <strong>{riskScore.toFixed(2)}</strong>
              <span>{riskLabel}</span>
              <div className="ay-progress"><span style={{ width: `${Math.round(riskScore * 100)}%` }} /></div>
            </div>
            <div className="ay-review-state">
              <strong>Review status</strong>
              <span>Nurse review in progress - Updated 2 min ago</span>
            </div>
          </div>
        </Card>
        <Card title="Live vitals (Latest)" action={<span className="ay-badge success">Streaming</span>}>
          <div className="ay-vitals ay-vitals-journey">
            {patient.vitals.slice(0, 3).map((vital) => (
              <StatCard key={vital.label} label={vital.label} value={vital.value} detail={vital.note} />
            ))}
          </div>
          <button type="button" className="ay-inline-banner">
            <span className="ay-inline-chip"><MedicalIcon name="spark" /> AI Insight</span>
            <strong>{patient.barrier === "None" ? "Recovery is progressing with stable signals." : `${patient.barrier} detected in the last 30 minutes.`}</strong>
            <em>View details &rarr;</em>
          </button>
        </Card>
        <div className="ay-journey-side">
          <AlertStack
            title="Alerts"
            items={[
              { label: patient.risk === "Routine" ? "No urgent alert triggered" : `${patient.vitals[0].label} needs review`, detail: patient.vitals[0].note, tone: patient.risk === "High priority" ? "danger" : "warning" },
              { label: patient.refillStatus, detail: patient.barrier, tone: /on hand/i.test(patient.refillStatus) ? "info" : "warning" }
            ]}
          />
          <ActionStack title="Actions" items={["Escalate to Nurse", "Review AI Summary", "Start Virtual Consultation"]} />
        </div>
      </div>
      <div className="ay-grid-2">
        <TimelineCard title="Journey timeline" items={patientTimeline} />
        <TeamCard patient={patient} />
      </div>
      <CameraPrepCard patient={patient} title="Virtual consultation" />
    </div>
  );
}

function NurseView({ queuePatients }: { queuePatients?: Patient[] }) {
  const queue = (queuePatients?.length ? queuePatients : priorityPatients()).slice(0, 6);
  const focusedPatient = queue[0];
  const nurseStages: JourneyStep[] = [
    { name: "Intake", status: "Completed", detail: "Completed", meta: "12 Apr, 10:32 AM", icon: "calendar" },
    { name: "Assessment", status: "In Progress", detail: `${queue.filter((patient) => patient.journeyStage === "Assessment" || patient.risk !== "Routine").length} patients`, meta: "Current nursing focus", icon: "heart" },
    { name: "Treatment", status: queue.some((patient) => patient.risk === "High priority") ? "Attention" : "In Progress", detail: `${queue.filter((patient) => patient.risk === "High priority").length} patients need review`, meta: "Medication and escalation review", icon: "pill" },
    { name: "Monitoring", status: "Upcoming", detail: `${queue.length} patients`, meta: "Remote vitals and callbacks", icon: "pulse" },
    { name: "Recovery", status: "Upcoming", detail: "Follow-ups planned", meta: "Care continuity checks", icon: "shield" }
  ];
  const nurseTimeline: Array<{ label: string; detail: string; meta: string; icon: IconName }> = queue.slice(0, 5).map((patient, index) => ({
    label: index === 0 ? "Intake completed" : index === 1 ? "Vitals received" : index === 2 ? "AI risk summary" : index === 3 ? "Nurse assigned" : "Note added",
    detail:
      index === 0
        ? `${patient.name} onboarded`
        : index === 1
          ? `Latest reading synced for ${patient.name}`
          : index === 2
            ? `${patient.name}: ${patient.risk}`
            : index === 3
              ? `${patient.name} assigned to ${patient.nurse}`
              : `${patient.nextAction}`,
    meta: `${patient.appointment}`,
    icon: index === 0 ? "calendar" : index === 1 ? "pulse" : index === 2 ? "spark" : index === 3 ? "nurse" : "message"
  }));

  return (
    <div className="ay-board ay-journey-board">
      <div className="ay-topbar">
        <div>
          <span className="ay-pill">Nurse care journey</span>
          <h2>Nurse care journey</h2>
          <p>Real-time overview of patient progress, triage responsibilities, and follow-up coordination.</p>
        </div>
        <JourneyLegend />
      </div>
      <JourneyStrip stages={nurseStages} />
      <div className="ay-journey-content nurse">
        <Card title={`My assignments`} action={<span className="ay-badge info">{queue.length}</span>}>
          <div className="ay-person-list">
            {queue.map((item) => (
              <button key={item.id} type="button" className={`ay-person-row ${item.id === focusedPatient.id ? "active" : ""}`}>
                <span className="ay-icon-badge large">
                  <MedicalIcon name="patient" />
                </span>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.id} - {item.diagnosis}</span>
                  <small>{item.vitals[0].note}</small>
                </div>
                <em className={badgeClass(item.journeyStage === "Assessment" ? "In Progress" : item.risk)}>{item.journeyStage}</em>
              </button>
            ))}
          </div>
        </Card>
        <Card title={focusedPatient.name} action={<button type="button" className="ay-ghost-button">View patient profile</button>}>
          <div className="ay-patient-focus-head">
            <div>
              <strong>{focusedPatient.id}</strong>
              <span>{focusedPatient.diagnosis}</span>
            </div>
            <span className={`ay-badge ${badgeClass(focusedPatient.journeyStage === "Assessment" ? "In Progress" : focusedPatient.risk)}`}>{focusedPatient.journeyStage}</span>
          </div>
          <div className="ay-vitals ay-vitals-journey four">
            {focusedPatient.vitals.slice(0, 4).map((vital) => (
              <StatCard key={vital.label} label={vital.label} value={vital.value} detail={vital.note} />
            ))}
          </div>
          <Card title="Care tasks" className="ay-subcard">
            <div className="ay-task-list">
              {[
                `Complete nursing assessment for ${focusedPatient.name}`,
                `Review AI risk summary for ${focusedPatient.name}`,
                `Patient education: medication and diet guidance`
              ].map((task, index) => (
                <div key={task} className="ay-task-row">
                  <div>
                    <strong>{task}</strong>
                    <span>{index === 0 ? "Due in 30 min" : index === 1 ? "Completed" : "Due today, 05:00 PM"}</span>
                  </div>
                  <button type="button" className={index === 1 ? "ay-ghost-button" : "ay-secondary-button"}>{index === 1 ? "View" : "Start"}</button>
                </div>
              ))}
            </div>
          </Card>
        </Card>
        <div className="ay-journey-side">
          <AlertStack
            title="Alerts"
            items={[
              { label: "High heart rate detected", detail: focusedPatient.name, tone: "danger" },
              { label: "Medication review pending", detail: queue[1]?.name ?? focusedPatient.name, tone: "warning" },
              { label: "Missed reading", detail: queue[2]?.name ?? focusedPatient.name, tone: "warning" }
            ]}
          />
          <ActionStack title="Quick actions" items={["Add Clinical Note", "Escalate to Doctor", "Send Patient Message", "Schedule Follow-up"]} />
        </div>
      </div>
      <div className="ay-grid-2">
        <TimelineCard title="Recent activity" items={nurseTimeline} />
        <Card title="Patients overview" action={<button type="button" className="ay-ghost-button">View full list</button>}>
          <div className="ay-kpis compact">
            <StatCard label="Total patients" value={queue.length * 4} detail="Across assigned caseloads" />
            <StatCard label="In progress" value={queue.filter((patient) => patient.journeyStage === "Assessment" || patient.journeyStage === "Monitoring").length} detail="Needs same-day follow-up" />
            <StatCard label="Attention" value={queue.filter((patient) => patient.risk === "High priority").length} detail="Escalation or intervention" />
            <StatCard label="Completed" value={queue.filter((patient) => patient.journeyStage === "Recovery").length} detail="Lower-intensity follow-up" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function PharmacistView({ queuePatients }: { queuePatients?: Patient[] }) {
  const queue = queuePatients?.length
    ? queuePatients
    : patients.filter((patient) => patient.refillStatus !== "On hand" || patient.risk !== "Routine");
  const focusedPatient = queue[0] ?? patients[0];
  const pharmacistStages: JourneyStep[] = [
    { name: "Intake", status: "Completed", detail: "Completed", meta: "12 Apr, 10:32 AM", icon: "calendar" },
    { name: "Assessment", status: "Completed", detail: "Completed", meta: "Medication history reviewed", icon: "heart" },
    { name: "Treatment", status: "In Progress", detail: "Medication review", meta: "Current pharmacist focus", icon: "pill" },
    { name: "Monitoring", status: "Upcoming", detail: "First reading scheduled", meta: focusedPatient.appointment, icon: "pulse" },
    { name: "Recovery", status: "Upcoming", detail: "Follow-up visit planned", meta: "Medication continuity check", icon: "shield" }
  ];
  const medicationSummary = {
    active: queue.length + 4,
    newPrescriptions: queue.filter((patient) => /insurance|review|hold/i.test(patient.refillStatus)).length,
    discontinued: 0,
    refillsDue: queue.filter((patient) => !/on hand/i.test(patient.refillStatus)).length
  };
  const pharmacistTimeline: Array<{ label: string; detail: string; meta: string; icon: IconName }> = queue.slice(0, 5).map((patient, index) => ({
    label: index === 0 ? "Intake completed" : index === 1 ? "Vitals received" : index === 2 ? "AI risk summary" : index === 3 ? "Medication review" : "Follow-up visit",
    detail:
      index === 0
        ? "All documents received"
        : index === 1
          ? `Data synced for ${patient.name}`
          : index === 2
            ? `${patient.name}: ${patient.risk}`
            : index === 3
              ? `${patient.medication} reviewed`
              : "Scheduled",
    meta: patient.appointment,
    icon: index === 3 ? "pharmacist" : index === 4 ? "calendar" : index === 2 ? "spark" : "pulse"
  }));

  return (
    <div className="ay-board ay-journey-board">
      <div className="ay-topbar">
        <div>
          <span className="ay-pill">Pharmacist care journey</span>
          <h2>Pharmacist care journey</h2>
          <p>Real-time overview of medication management, review tasks, and patient safety signals.</p>
        </div>
        <JourneyLegend />
      </div>
      <JourneyStrip stages={pharmacistStages} />
      <div className="ay-journey-content pharmacist">
        <Card title="Patient queue" action={<span className="ay-badge info">{queue.length}</span>}>
          <div className="ay-person-list">
            {queue.map((item) => (
              <button key={item.id} type="button" className={`ay-person-row ${item.id === focusedPatient.id ? "active" : ""}`}>
                <span className="ay-icon-badge large">
                  <MedicalIcon name="patient" />
                </span>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.id} - {item.diagnosis}</span>
                  <small>{item.medication}</small>
                </div>
                <em className={badgeClass(item.refillStatus)}>{item.refillStatus}</em>
              </button>
            ))}
          </div>
        </Card>
        <Card title={focusedPatient.name} action={<button type="button" className="ay-ghost-button">View patient profile</button>}>
          <div className="ay-patient-focus-head">
            <div>
              <strong>{focusedPatient.medication}</strong>
              <span>{focusedPatient.diagnosis}</span>
            </div>
            <span className="ay-badge info">AI Assisted</span>
          </div>
          <div className="ay-kpis compact">
            <StatCard label="Total medications" value="7" detail="Active" />
            <StatCard label="Drug interactions" value={focusedPatient.risk === "High priority" ? "1" : "0"} detail={focusedPatient.risk === "High priority" ? "High risk" : "No high-risk signal"} />
            <StatCard label="Duplicate therapy" value="0" detail="Detected" />
            <StatCard label="Allergy alerts" value="0" detail="Found" />
          </div>
          <div className="ay-interaction-banner danger">
            <div>
              <strong>{focusedPatient.medication}</strong>
              <span>{focusedPatient.barrier}</span>
            </div>
            <em>{focusedPatient.risk === "High priority" ? "Risk: High" : "Review Pending"}</em>
            <button type="button" className="ay-ghost-button">View details</button>
          </div>
          <Card title="Pharmacy tasks" className="ay-subcard">
            <div className="ay-task-list">
              {[
                `Review and resolve medication issue for ${focusedPatient.name}`,
                `Verify prescription with assigned physician`,
                `Patient counseling: continuity and pickup support`
              ].map((task, index) => (
                <div key={task} className="ay-task-row">
                  <div>
                    <strong>{task}</strong>
                    <span>{index === 0 ? "Due in 30 min" : index === 1 ? "Due in 45 min" : "Due today, 05:00 PM"}</span>
                  </div>
                  <button type="button" className="ay-secondary-button">Start</button>
                </div>
              ))}
            </div>
          </Card>
        </Card>
        <div className="ay-journey-side">
          <AlertStack
            title="Alerts"
            items={[
              { label: "High risk drug interaction", detail: focusedPatient.name, tone: "danger" },
              { label: "Prescription clarification needed", detail: queue[1]?.name ?? focusedPatient.name, tone: "warning" },
              { label: "Allergy information missing", detail: queue[2]?.name ?? focusedPatient.name, tone: "warning" }
            ]}
          />
          <ActionStack title="Quick actions" items={["Verify Prescription", "Add Medication Note", "Patient Counseling", "Medication Reconciliation", "Send Message to Nurse"]} />
        </div>
      </div>
      <div className="ay-grid-2">
        <TimelineCard title="Recent activity" items={pharmacistTimeline} />
        <Card title="Medication summary" action={<button type="button" className="ay-ghost-button">View full list</button>}>
          <div className="ay-kpis compact">
            <StatCard label="Active medications" value={medicationSummary.active} detail="Current patient queue" />
            <StatCard label="New prescriptions" value={medicationSummary.newPrescriptions} detail="Need verification" />
            <StatCard label="Discontinued" value={medicationSummary.discontinued} detail="No new removals" />
            <StatCard label="Refills due" value={medicationSummary.refillsDue} detail="Needs same-day action" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function PendingOnboardingHome({ pendingAccess }: { pendingAccess: PendingAccessRequestContract }) {
  const [request, setRequest] = useState(pendingAccess);
  const [displayName, setDisplayName] = useState(pendingAccess.displayName);
  const [phone, setPhone] = useState(pendingAccess.phone ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(pendingAccess.dateOfBirth ?? "");
  const [addressLine, setAddressLine] = useState(pendingAccess.addressLine ?? "");
  const [diagnosisSummary, setDiagnosisSummary] = useState(pendingAccess.diagnosisSummary ?? "");
  const [dischargeFacility, setDischargeFacility] = useState(pendingAccess.dischargeFacility ?? "");
  const [emergencyContactName, setEmergencyContactName] = useState(pendingAccess.emergencyContactName ?? "");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(pendingAccess.emergencyContactPhone ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  useEffect(() => {
    setRequest(pendingAccess);
    setDisplayName(pendingAccess.displayName);
    setPhone(pendingAccess.phone ?? "");
    setDateOfBirth(pendingAccess.dateOfBirth ?? "");
    setAddressLine(pendingAccess.addressLine ?? "");
    setDiagnosisSummary(pendingAccess.diagnosisSummary ?? "");
    setDischargeFacility(pendingAccess.dischargeFacility ?? "");
    setEmergencyContactName(pendingAccess.emergencyContactName ?? "");
    setEmergencyContactPhone(pendingAccess.emergencyContactPhone ?? "");
  }, [pendingAccess]);

  useEffect(() => {
    if (request.status !== "submitted" && request.status !== "approved") return;

    let active = true;
    let timerId = 0;

    const syncStatus = async () => {
      try {
        const statusResponse = await fetch("/api/auth/pending/status", { cache: "no-store" });
        const statusPayload = (await statusResponse.json().catch(() => null)) as
          | { request?: PendingAccessRequestContract | null; approved?: boolean }
          | null;

        if (!statusResponse.ok || !statusPayload?.request || !active) {
          return;
        }

        setRequest(statusPayload.request);

        if (statusPayload.approved) {
          const activateResponse = await fetch("/api/auth/pending/activate", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
          });
          const activatePayload = (await activateResponse.json().catch(() => null)) as { redirectTo?: string; error?: string } | null;

          if (activateResponse.ok && activatePayload?.redirectTo) {
            window.location.assign(activatePayload.redirectTo);
            return;
          }

          if (active && activatePayload?.error) {
            setFeedbackMessage(activatePayload.error);
          }
        }
      } catch {
        if (active) {
          setFeedbackMessage("We could not refresh your approval status. Try reloading this page.");
        }
      }
    };

    void syncStatus();
    timerId = window.setInterval(() => {
      void syncStatus();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(timerId);
    };
  }, [request.status]);

  async function handleSubmit() {
    setSubmitting(true);
    setFeedbackMessage("");

    try {
      const response = await fetch("/api/auth/pending/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          phone,
          dateOfBirth,
          addressLine,
          diagnosisSummary,
          dischargeFacility,
          emergencyContactName,
          emergencyContactPhone
        })
      });
      const payload = (await response.json().catch(() => null)) as { request?: PendingAccessRequestContract; error?: string } | null;
      if (!response.ok || !payload?.request) {
        setFeedbackMessage(payload?.error ?? "Unable to submit the patient information form.");
        return;
      }

      setRequest(payload.request);
      setFeedbackMessage("Application is under process.");
    } catch {
      setFeedbackMessage("Unable to submit the patient information form right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ay-board">
      <Card className="ay-home-hero-banner-card">
        <div className="ay-home-hero-banner">
          <Image src="/homepage-banner-wide.png" alt="ArogyaYatra integrated co-ordination journey banner" width={1672} height={1080} priority />
        </div>
      </Card>
      <Card className="ay-login-gate-card">
        <div className="ay-login-gate-copy">
          <span className="ay-kicker">Patient onboarding</span>
          <strong>Login to access the Dashboard</strong>
          <span>Google authentication created a pending patient access request. Complete the patient information form so Admin can review and assign the final role.</span>
        </div>
      </Card>
      <div className="ay-grid-2">
        <Card title="Complete patient information" className="ay-onboarding-card">
          {request.status === "details_required" ? (
            <div className="ay-form-grid ay-onboarding-grid">
              <label className="ay-field">
                <span>Full name</span>
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
              </label>
              <label className="ay-field">
                <span>Email</span>
                <input value={request.email} readOnly />
              </label>
              <label className="ay-field">
                <span>Phone</span>
                <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+1 (555) 000-0000" />
              </label>
              <label className="ay-field">
                <span>Date of birth</span>
                <input type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} />
              </label>
              <label className="ay-field full">
                <span>Address</span>
                <input value={addressLine} onChange={(event) => setAddressLine(event.target.value)} placeholder="Street, city, state" />
              </label>
              <label className="ay-field full">
                <span>Diagnosis summary</span>
                <textarea value={diagnosisSummary} onChange={(event) => setDiagnosisSummary(event.target.value)} rows={3} placeholder="Describe the current discharge diagnosis or reason for follow-up." />
              </label>
              <label className="ay-field full">
                <span>Discharge facility or care location</span>
                <input value={dischargeFacility} onChange={(event) => setDischargeFacility(event.target.value)} placeholder="Hospital, clinic, or care unit" />
              </label>
              <label className="ay-field">
                <span>Emergency contact name</span>
                <input value={emergencyContactName} onChange={(event) => setEmergencyContactName(event.target.value)} />
              </label>
              <label className="ay-field">
                <span>Emergency contact phone</span>
                <input value={emergencyContactPhone} onChange={(event) => setEmergencyContactPhone(event.target.value)} />
              </label>
              <div className="ay-form-actions">
                <button className="ay-primary-button" type="button" onClick={() => void handleSubmit()} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit patient information"}
                </button>
              </div>
            </div>
          ) : (
            <div className="ay-onboarding-status">
              <span className="ay-pill">{request.status === "approved" ? "Approved" : request.status === "rejected" ? "Needs follow-up" : "Submitted"}</span>
              <strong>{request.status === "approved" ? "Approval completed." : "Application is under process."}</strong>
              <p>
                {request.status === "approved"
                  ? "Your role-based access has been approved. We are opening the correct dashboard for you now."
                  : request.status === "rejected"
                    ? "The access request needs follow-up from Admin. Please contact the care operations team."
                    : "Admin will review the patient information, approve access, and can change the final role before your dashboard becomes visible."}
              </p>
              <div className="ay-detail-list">
                <div><strong>Requested role</strong><span>{request.desiredRole}</span></div>
                <div><strong>Provider</strong><span>{request.provider}</span></div>
                <div><strong>Submitted</strong><span>{request.submittedAt ? formatMockLoginTime(request.submittedAt) : "Waiting on form completion"}</span></div>
              </div>
            </div>
          )}
          {feedbackMessage ? <p className="ay-form-feedback info">{feedbackMessage}</p> : null}
        </Card>
        <Card title="What happens next" className="ay-onboarding-card">
          <ul className="ay-list">
            <li><strong>Step 1</strong><span>Your Google account is provisionally registered as a patient access request.</span></li>
            <li><strong>Step 2</strong><span>Complete the patient information form so Admin can review the request safely.</span></li>
            <li><strong>Step 3</strong><span>Admin can approve the request as patient or change the final role before access is activated.</span></li>
            <li><strong>Step 4</strong><span>Once approved, your role-based dashboard becomes visible automatically.</span></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function HomeView({
  isAuthenticated,
  pendingAccess
}: {
  isAuthenticated: boolean;
  pendingAccess?: PendingAccessRequestContract | null;
}) {
  const now = useCurrentTime();
  const dateInfo = formatDateTime(now);
  const topPatient = priorityPatients()[0];
  const workspaceActions = [
    ...homeActions,
    {
      label: "Developer board",
      href: "/developer",
      icon: "developer" as const,
      detail: "Observe traces, agent health, guardrails, and live multi-agent orchestration signals."
    }
  ];
  const supportPillars = [
    {
      icon: "heart" as const,
      title: "Personalized support",
      detail: "Clear role-based pathways help patients, families, and care teams stay aligned after discharge."
    },
    {
      icon: "calendar" as const,
      title: "Care plan management",
      detail: "Appointments, reminders, and follow-up activities remain visible in one calm coordination experience."
    },
    {
      icon: "pulse" as const,
      title: "Follow-up monitoring",
      detail: "Vitals, symptom review, and next-step coordination stay connected without overwhelming the user."
    },
    {
      icon: "pill" as const,
      title: "Medication continuity",
      detail: "Refill access, pickup support, and pharmacy coordination are surfaced early to reduce missed doses."
    }
  ];
  const [tickerMessages, setTickerMessages] = useState<string[]>([positiveQuote]);

  useEffect(() => {
    const messages = shuffleMessages(approvedHomeRibbonMessages(HOME_POSITIVE_MESSAGES));
    setTickerMessages(messages);
  }, []);

  if (pendingAccess) {
    return <PendingOnboardingHome pendingAccess={pendingAccess} />;
  }

  if (!isAuthenticated) {
    return (
      <div className="ay-board">
        <Card className="ay-home-hero-banner-card">
          <div className="ay-home-hero-banner">
            <Image src="/homepage-banner-wide.png" alt="ArogyaYatra integrated co-ordination journey banner" width={1672} height={1080} priority />
          </div>
        </Card>
        <Card className="ay-login-gate-card">
          <div className="ay-login-gate-copy">
            <span className="ay-kicker">Home</span>
            <strong>Login to access the Dashboard</strong>
            <span>Sign in with Google or use your approved role-based credentials to continue into ArogyaYatra.</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="ay-board">
      <section className="ay-live-strip" aria-live="polite">
        <div className="ay-live-welcome">Welcome to ArogyaYatra.</div>
        <div className="ay-live-ticker">
          <div className="ay-live-track">
            {[...tickerMessages, ...tickerMessages].map((message, index) => (
              <span key={`${message}-${index}`}>{message}</span>
            ))}
          </div>
        </div>
        <div className="ay-live-meta">
          <span>{dateInfo.dateLabel}</span>
          <strong>{dateInfo.timeLabel}</strong>
        </div>
      </section>
      <Card className="ay-home-hero-banner-card">
        <div className="ay-home-hero-banner">
          <Image src="/homepage-banner-wide.png" alt="ArogyaYatra integrated co-ordination journey banner" width={1672} height={1080} priority />
        </div>
      </Card>
      <Card className="ay-home-action-ribbon-card">
        <div className="ay-home-action-ribbon">
          <div className="ay-home-action-copy">
            <span className="ay-kicker">Available Workspaces</span>
            <strong>Choose a role</strong>
            <span>Select the workspace that matches how you want to use ArogyaYatra today.</span>
          </div>
          <div className="ay-home-workspace-grid">
            {workspaceActions.map((item) => (
              <WorkspaceCard key={item.href} icon={item.icon} title={item.label} detail={item.detail} href={item.href} />
            ))}
          </div>
        </div>
      </Card>
      <Card title="How ArogyaYatra helps" className="ay-support-pillars-card">
        <div className="ay-support-pillars">
          {supportPillars.map((item) => (
            <SupportPillar key={item.title} icon={item.icon} title={item.title} detail={item.detail} />
          ))}
        </div>
      </Card>
      <Card className="ay-care-journey-image-card">
        <div className="ay-care-journey-image">
          <Image src="/care_journey_home_page.png" alt="ArogyaYatra care journey overview" width={1919} height={795} />
        </div>
      </Card>
      <div className="ay-grid-3">
        <Card title="Care support today">
          <div className="ay-kpis compact"><StatCard label="Patients" value={patients.length} detail="MVP care cohort" /><StatCard label="Nurses" value={nurses.length} detail="Daily workload model" /><StatCard label="Pharmacists" value={pharmacists.length} detail="Refill access model" /><StatCard label="Virtual visits" value="Ready" detail="Pre-call check available" /></div>
        </Card>
        <Card title="Customer support pathways">
          <ul className="ay-list">
            <li><strong><span className="ay-inline-icon"><MedicalIcon name="patient" /></span>Patient support</strong><span>Recovery guidance, medicines, and virtual visit readiness in one place.</span></li>
            <li><strong><span className="ay-inline-icon"><MedicalIcon name="nurse" /></span>Nurse coordination</strong><span>Daily triage review and same-day follow-up for higher-risk recovery paths.</span></li>
            <li><strong><span className="ay-inline-icon"><MedicalIcon name="pharmacist" /></span>Pharmacy continuity</strong><span>Refill blockers, insurance access, and pickup support without hidden handoffs.</span></li>
            <li><strong><span className="ay-inline-icon"><MedicalIcon name="shield" /></span>Safe oversight</strong><span>Clear escalation logic and guided workflows support safer healthcare coordination.</span></li>
          </ul>
        </Card>
        <CameraPrepCard patient={topPatient} title="Virtual consultation" />
      </div>
      <div className="ay-grid-2">
        <Card title="AI Enabled Feedback">
          <ul className="ay-list">
            <li><strong>Capture page feedback</strong><span>Open AI Enabled Feedback from any page with source context already attached.</span></li>
            <li><strong>Generate AI prompts</strong><span>Turn workflow feedback into a ChatGPT-ready prompt customized for patient, nurse, customer, pharmacist, or admin use.</span></li>
            <li><strong>Stay user-centered</strong><span>Keep AI features aligned with real needs before implementation.</span></li>
          </ul>
          <div className="ay-actions">
            <Link className="ay-button ay-button-secondary" href={`/feedback?sourceRole=home&patientId=${topPatient.id}`}>Open AI Enabled Feedback</Link>
          </div>
        </Card>
        <Card title="Current month">
          <CalendarPanel now={now} />
        </Card>
      </div>
    </div>
  );
}

export function ArogyaYatraDashboard({
  initialRole = "home",
  patientId = "PT-1001",
  initialSession = null,
  pendingAccess = null,
  nursePatientIds,
  pharmacistPatientIds,
  pendingApprovals = [],
  developerSourceRole,
  developerPatientId,
  feedbackRequestAccess = false,
  feedbackProvider
}: {
  initialRole?: Role;
  patientId?: string;
  initialSession?: AuthenticatedSession | null;
  pendingAccess?: PendingAccessRequestContract | null;
  nursePatientIds?: string[];
  pharmacistPatientIds?: string[];
  pendingApprovals?: PendingAccessRequestContract[];
  developerSourceRole?: Role;
  developerPatientId?: string;
  feedbackRequestAccess?: boolean;
  feedbackProvider?: string;
}) {
  const [selection, setSelection] = useState<EntitySelection>(null);
  const [smartClicks, setSmartClicks] = useState(false);
  const patient = useMemo(() => getPatientById(patientId), [patientId]);
  const nurseQueue = useMemo(() => getPatientsByIds(nursePatientIds ?? []), [nursePatientIds]);
  const pharmacistQueue = useMemo(() => getPatientsByIds(pharmacistPatientIds ?? []), [pharmacistPatientIds]);
  const isAuthenticated = Boolean(initialSession);
  const role = initialRole;
  const feedbackSourceRole = role === "feedback" ? "home" : role;
  const feedbackHref = `/feedback?sourceRole=${feedbackSourceRole}&patientId=${patient.id}`;
  const visibleNavItems = useMemo(() => getVisibleNavItems(initialSession), [initialSession]);

  return (
    <div className={`ay-shell${smartClicks ? " ay-smart-clicks-active" : ""}`}>
      <button
        type="button"
        className={`ay-smart-clicks-toggle${smartClicks ? " active" : ""}`}
        aria-pressed={smartClicks}
        onClick={() => setSmartClicks((value) => !value)}
      >
        <span>SMART CLICKS</span>
        <strong>{smartClicks ? "Back to normal view" : "Highlight what can be clicked"}</strong>
      </button>
      <aside className="ay-sidebar">
        <Link href="/" className="ay-brand">
          <Image src="/arogyayatra-logo.png" alt="ArogyaYatra logo" width={58} height={58} />
          <div><strong>ArogyaYatra</strong><span>AI enabled Healthcare Coordinator</span></div>
        </Link>
        <div className="ay-sidebar-intro">
          <strong>AI-powered care coordination platform</strong>
          <span>Bringing patients, nurses, pharmacists, and care teams together for a better recovery journey.</span>
        </div>
        <div className="ay-sidebar-trust-box">
          <span className="ay-icon-badge">
            <MedicalIcon name="shield" />
          </span>
          <div>
            <strong>Trusted for secure virtual care</strong>
            <span>Your access is protected through role-aware workflows and safe review.</span>
          </div>
        </div>
        <SidebarAuth role={role} initialSession={initialSession} pendingAccess={pendingAccess} />
        <nav>
          {visibleNavItems.map((item) => (
            <Link key={item.id} href={item.href} className={role === item.id ? "active" : ""}>
              <span className="ay-nav-icon">
                <MedicalIcon name={item.icon} />
              </span>
              <span className="ay-nav-copy">
                <strong>{item.label}</strong>
                <span>{item.hint}</span>
              </span>
            </Link>
          ))}
        </nav>
        <div className="ay-sidebar-actions">
          {isAuthenticated ? <Link href={feedbackHref} className="ay-sidebar-feedback">Help us improve</Link> : null}
          <div className="ay-sidebar-footer-note">
            <span className="ay-icon-badge">
              <MedicalIcon name="shield" />
            </span>
            <span>Your data is secure and compliant with healthcare privacy standards.</span>
          </div>
        </div>
      </aside>
      <main className="ay-main">
        {role === "home" ? <HomeView isAuthenticated={isAuthenticated} pendingAccess={pendingAccess} /> : null}
        {role === "admin" ? <AdminView onSelect={setSelection} pendingApprovals={pendingApprovals} /> : null}
        {role === "patient" ? <PatientView patient={patient} /> : null}
        {role === "nurse" ? <NurseView queuePatients={nurseQueue} /> : null}
        {role === "pharmacist" ? <PharmacistView queuePatients={pharmacistQueue} /> : null}
        {role === "developer" ? <DeveloperConsoleView /> : null}
        {role === "feedback" ? (
          <DeveloperView
            currentRole={role}
            currentPatient={patient}
            sourceRoleFromQuery={developerSourceRole}
            patientIdFromQuery={developerPatientId}
            requestAccessFromQuery={feedbackRequestAccess}
            providerFromQuery={feedbackProvider}
          />
        ) : null}
      </main>
      <Assistant role={role} patient={patient} session={initialSession} />
      <EntityModal selection={selection} onClose={() => setSelection(null)} />
    </div>
  );
}

