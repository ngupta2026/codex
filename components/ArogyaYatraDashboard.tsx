"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  agentCapabilities,
  answerCareQuestion,
  getPatientById,
  journeyStages,
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

const navItems: Array<{ id: Role; label: string; href: string }> = [
  { id: "home", label: "Home", href: "/" },
  { id: "patient", label: "Patient", href: "/patient/PT-1001" },
  { id: "nurse", label: "Nurse", href: "/nurse" },
  { id: "pharmacist", label: "Pharmacist", href: "/pharmacist" },
  { id: "developer", label: "Developer", href: "/developer" }
];

const homeActions: Array<{ label: string; href: string }> = [
  { label: "Admin dashboard", href: "/admin" },
  { label: "Patient dashboard", href: "/patient/PT-1001" },
  { label: "Nurse dashboard", href: "/nurse" },
  { label: "Pharmacist dashboard", href: "/pharmacist" }
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const positiveQuote = "Small steps today build safer recoveries tomorrow.";
type IconName = "heart" | "calendar" | "camera" | "pill" | "shield" | "stethoscope" | "pulse" | "message";

function shuffleMessages(values: string[]): string[] {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
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

function CameraPrepCard({ patient, title }: { patient: Patient; title: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card title={title} action={<button className="ay-ghost-button" type="button" onClick={() => setOpen(true)}>Open pre-call</button>}>
        <div className="ay-camera-shell">
          <div className="ay-camera">
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
                  <div className="ay-camera-avatar large">
                    <MedicalIcon name="camera" />
                  </div>
                  <strong>{patient.name}</strong>
                  <span>Preview your video before joining the virtual visit.</span>
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
  patientIdFromQuery
}: {
  currentRole: Role;
  currentPatient: Patient;
  sourceRoleFromQuery?: Role;
  patientIdFromQuery?: string;
}) {
  const [sourceRole, setSourceRole] = useState<Role>(sourceRoleFromQuery || (currentRole !== "developer" ? currentRole : "home"));
  const [patientId, setPatientId] = useState(patientIdFromQuery || currentPatient.id);
  const [userType, setUserType] = useState("customer");
  const [aiGoal, setAiGoal] = useState("care coordination");
  const [feedback, setFeedback] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [constraints, setConstraints] = useState("Keep the feature calm, explainable, and safe for healthcare coordination.");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [contextSummary, setContextSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedPatient = getPatientById(patientId);

  async function generatePrompt() {
    setLoading(true);
    try {
      const response = await fetch("/api/developer-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceRole, patientId, userType, aiGoal, feedback, desiredOutcome, constraints })
      });
      const payload = (await response.json()) as { prompt?: string; contextSummary?: string; error?: string };
      if (!response.ok || !payload.prompt) {
        throw new Error(payload.error || "Prompt generation failed");
      }
      setGeneratedPrompt(payload.prompt);
      setContextSummary(payload.contextSummary || "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ay-board">
      <div className="ay-topbar">
        <div>
          <span className="ay-pill">Developer board</span>
          <h2>AI feature prompt builder</h2>
          <p>Capture feedback from any page, choose the end-user persona, and generate a ChatGPT-ready prompt for tailored AI features.</p>
        </div>
      </div>
      <div className="ay-grid-2">
        <Card title="Feedback intake">
          <div className="ay-form-grid">
            <label className="ay-field">
              <span>Source page</span>
              <select value={sourceRole} onChange={(event) => setSourceRole(event.target.value as Role)}>
                {navItems.filter((item) => item.id !== "developer").map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
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
              <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Describe the pain point, missing AI behavior, or workflow gap." rows={5} />
            </label>
            <label className="ay-field full">
              <span>Desired outcome</span>
              <textarea value={desiredOutcome} onChange={(event) => setDesiredOutcome(event.target.value)} placeholder="Describe what the app should do for this end user." rows={4} />
            </label>
            <label className="ay-field full">
              <span>Constraints</span>
              <textarea value={constraints} onChange={(event) => setConstraints(event.target.value)} rows={3} />
            </label>
            <div className="ay-form-actions">
              <button className="ay-primary-button" type="button" onClick={() => void generatePrompt()}>{loading ? "Generating..." : "Generate ChatGPT prompt"}</button>
            </div>
          </div>
        </Card>
        <Card title="Context snapshot">
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
        </Card>
      </div>
      <Card title="Generated prompt" action={contextSummary ? <span className="ay-badge info">{contextSummary}</span> : null}>
        <div className="ay-prompt-preview">
          <textarea value={generatedPrompt} readOnly placeholder="Generate a prompt to create a ChatGPT-ready AI feature brief from this page feedback." rows={18} />
        </div>
      </Card>
    </div>
  );
}

function Assistant({ role, patient }: { role: Role; patient: Patient }) {
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
              : "Developer assistant";

  async function respond(text: string) {
    const cleaned = text.trim();
    if (!cleaned) return;
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, patientId: patient.id, question: cleaned })
      });
      if (!response.ok) throw new Error("Chat route failed");
      const payload = (await response.json()) as { answer: string; agentsUsed?: string[] };
      setAnswer(`${payload.answer}${payload.agentsUsed?.length ? ` Agents used: ${payload.agentsUsed.join(", ")}.` : ""}`);
    } catch {
      const fallback = answerCareQuestion(role, patient.id, cleaned);
      setAnswer(`${fallback.answer} Agents used: ${fallback.agentsUsed.join(", ")}.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="ay-chat">
      <div className="ay-chat-head">
        <strong>{title}</strong>
        <span>Page-specific coded assistant</span>
      </div>
      <div className="ay-chat-answer">{answer}</div>
      <div className="ay-chat-suggestions">
        {["What should I review first?", "Show medication history", "Explain current blockers"].map((item) => (
          <button key={item} type="button" onClick={() => void respond(item)}>
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
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask about this page" />
        <button type="submit">{loading ? "..." : "Ask"}</button>
      </form>
    </aside>
  );
}

function AdminView({ onSelect }: { onSelect: (selection: EntitySelection) => void }) {
  const now = useCurrentTime();
  const dateInfo = formatDateTime(now);
  const calendarCells = now ? buildCalendarCells(now) : [];
  const riskCount = patients.filter((patient) => patient.risk !== "Routine").length;
  const totalMessages = patients.reduce((sum, patient) => sum + patient.messages, 0);
  const todaysAppointments = patients.filter((patient) => patient.appointment.startsWith("Today")).length;
  const topPatients = priorityPatients().slice(0, 3);
  const topNurses = priorityNurses().slice(0, 3);
  const topPharmacists = priorityPharmacists().slice(0, 3);

  return (
    <div className="ay-board">
      <div className="ay-topbar">
        <div>
          <span className="ay-pill">Admin dashboard</span>
          <h2>Operational overview</h2>
          <p>ArogyaYatra combines care-team workload, appointments, patient risk, and refill pressure into one coded command surface.</p>
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

function PatientView({ patient }: { patient: Patient }) {
  return (
    <div className="ay-board">
      <div className="ay-topbar">
        <div>
          <span className="ay-pill">Patient dashboard</span>
          <h2>Good morning, {patient.name.split(" ")[0]}.</h2>
          <p>{patient.diagnosis}. Assigned nurse {patient.nurse} and pharmacist {patient.pharmacist} are following today&apos;s plan.</p>
        </div>
        <span className={badgeClass(patient.risk)}>{patient.risk}</span>
      </div>
      <div className="ay-grid-3">
        <Card title="What to do now"><ul className="ay-list"><li>Take morning dose of {patient.medication}.</li><li>{patient.nextAction}.</li><li>Log oxygen and temperature before noon.</li></ul></Card>
        <Card title="Medicines"><div className="ay-stack"><StatCard label="Medication" value={patient.medication} detail="Next dose in 35 minutes" /><StatCard label="Refill status" value={patient.refillStatus} detail={patient.barrier} /></div></Card>
        <Card title="When to call for help"><ul className="ay-list"><li>Breathing feels worse than yesterday.</li><li>Fever rises above plan threshold.</li><li>You cannot access medicine or transportation.</li></ul></Card>
      </div>
      <div className="ay-grid-2">
        <Card title="Appointments"><ul className="ay-list"><li><strong>{patient.appointment}</strong><span>Ride or virtual check-in confirmed</span></li><li><strong>Lab check</strong><span>Tomorrow 09:00 AM - bring medication list</span></li></ul></Card>
        <Card title="Progress checklist"><div className="ay-progress"><span style={{ width: "72%" }} /></div><ul className="ay-list"><li>Medication reminder complete</li><li>Appointment confirmed</li><li>Vitals check pending</li></ul></Card>
      </div>
      <div className="ay-grid-2">
        <Card title="Vital snapshot"><div className="ay-vitals">{patient.vitals.map((vital) => <StatCard key={vital.label} label={vital.label} value={vital.value} detail={vital.note} />)}</div></Card>
        <CameraPrepCard patient={patient} title="Virtual care camera" />
      </div>
    </div>
  );
}

function NurseView() {
  const queue = priorityPatients().slice(0, 6);
  return (
    <div className="ay-board">
      <div className="ay-topbar"><div><span className="ay-pill">Nurse dashboard</span><h2>Shift triage queue</h2><p>Monitor high-priority follow-ups, vitals drift, missed medications, and unresolved transport issues.</p></div></div>
      <div className="ay-kpis"><StatCard label="High priority" value={patients.filter((p) => p.risk === "High priority").length} detail="Immediate review" /><StatCard label="Watch closely" value={patients.filter((p) => p.risk === "Watch closely").length} detail="Same-day follow-up" /><StatCard label="Logistics blockers" value={patients.filter((p) => p.barrier !== "None").length} detail="Transport or refill" /><StatCard label="Avg response" value="12m" detail="Team callback speed" /></div>
      <div className="ay-grid-2"><Card title="Patient queue"><table className="ay-table"><tbody>{queue.map((p) => <tr key={p.id}><td>{p.name}</td><td><span className={badgeClass(p.risk)}>{p.risk}</span></td><td>{p.barrier}</td><td>{p.nextAction}</td></tr>)}</tbody></table></Card><Card title="Current patient summary"><ul className="ay-list">{queue.slice(0, 4).map((p) => <li key={p.id}><strong>{p.name}</strong><span>{p.diagnosis} - {p.nextAction}</span></li>)}</ul></Card></div>
    </div>
  );
}

function PharmacistView() {
  const queue = patients.filter((patient) => patient.refillStatus !== "On hand" || patient.risk !== "Routine");
  return (
    <div className="ay-board">
      <div className="ay-topbar"><div><span className="ay-pill">Pharmacist dashboard</span><h2>Medication coordination board</h2><p>Track refill work, adherence risks, insurance access issues, and delivery or pickup blockers.</p></div></div>
      <div className="ay-kpis"><StatCard label="Open refill tasks" value={queue.length} detail="Needs action today" /><StatCard label="Insurance issues" value={queue.filter((p) => /insurance/i.test(p.refillStatus)).length} detail="Verification needed" /><StatCard label="Pickup barriers" value={queue.filter((p) => /pickup|transport/i.test(p.barrier)).length} detail="Caregiver or courier gap" /><StatCard label="Adherence risks" value={queue.filter((p) => /confusion|missed/i.test(p.barrier)).length} detail="Counseling needed" /></div>
      <div className="ay-grid-2"><Card title="Medication queue"><table className="ay-table"><tbody>{queue.slice(0, 7).map((p) => <tr key={p.id}><td>{p.name}</td><td>{p.medication}</td><td><span className={badgeClass(p.refillStatus)}>{p.refillStatus}</span></td><td>{p.barrier}</td></tr>)}</tbody></table></Card><Card title="Pharmacist workload"><ul className="ay-list">{pharmacists.map((p) => <li key={p.id}><strong>{p.name}</strong><span>{p.fillsToday} fills today - {p.queueSize} queue items</span></li>)}</ul></Card></div>
    </div>
  );
}

function HomeView() {
  const now = useCurrentTime();
  const dateInfo = formatDateTime(now);
  const topPatient = priorityPatients()[0];
  const [tickerMessages, setTickerMessages] = useState<string[]>([positiveQuote]);

  useEffect(() => {
    const messages = shuffleMessages([
      positiveQuote,
      `${topPatient.name} is the top coordination focus today.`,
      `Current journey stage: ${topPatient.journeyStage}.`,
      `Assigned nurse: ${topPatient.nurse}.`,
      `Medication continuity: ${topPatient.refillStatus}.`,
      `Barrier to resolve: ${topPatient.barrier}.`
    ]);
    setTickerMessages(messages);
  }, [topPatient]);

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
      <div className="ay-hero">
        <Card className="ay-hero-card ay-hero-copy">
          <span className="ay-pill">ArogyaYatra</span>
          <h2>AI Enabled Integrated co-ordination journey for post-discharge virtual care.</h2>
          <p>Arogya means wellness and Yatra means journey. We are on an AI enabled wellness journey for a better future together.</p>
          <div className="ay-feature-strip">
            <span className="ay-feature-chip"><span className="ay-icon-badge"><MedicalIcon name="heart" /></span> Recovery journey</span>
            <span className="ay-feature-chip"><span className="ay-icon-badge"><MedicalIcon name="pulse" /></span> Vitals monitoring</span>
            <span className="ay-feature-chip"><span className="ay-icon-badge"><MedicalIcon name="pill" /></span> Medication continuity</span>
            <span className="ay-feature-chip"><span className="ay-icon-badge"><MedicalIcon name="camera" /></span> Virtual visit prep</span>
          </div>
          <div className="ay-actions">{homeActions.map((item) => <Link key={item.href} className="ay-button" href={item.href}>{item.label}</Link>)}</div>
        </Card>
        <Card className="ay-hero-card ay-hero-media">
          <div className="ay-home-banner">
            <Image src="/homepage-banner.png" alt="ArogyaYatra post-discharge virtual care banner" width={1000} height={400} priority />
          </div>
        </Card>
      </div>
      <Card title="Care journey">
        <div className="ay-journey">
          {journeyStages.map((stage) => (
            <div key={stage} className={`ay-stage ${stage === topPatient.journeyStage ? "current" : ""}`}>
              <span>{stage}</span>
              <strong>{stage === topPatient.journeyStage ? "Current focus" : "Ready"}</strong>
            </div>
          ))}
        </div>
      </Card>
      <div className="ay-grid-3">
        <Card title="Care support today">
          <div className="ay-kpis compact"><StatCard label="Patients" value={patients.length} detail="MVP care cohort" /><StatCard label="Nurses" value={nurses.length} detail="Daily workload model" /><StatCard label="Pharmacists" value={pharmacists.length} detail="Refill access model" /><StatCard label="Virtual visits" value="Ready" detail="Pre-call check available" /></div>
        </Card>
        <Card title="Top coordination need">
          <ul className="ay-list">
            <li><strong><span className="ay-inline-icon"><MedicalIcon name="heart" /></span>{topPatient.name}</strong><span>{topPatient.risk} - {topPatient.nextAction}</span></li>
            <li><strong><span className="ay-inline-icon"><MedicalIcon name="stethoscope" /></span>Care team</strong><span>Nurse {topPatient.nurse}; pharmacist {topPatient.pharmacist}</span></li>
            <li><strong><span className="ay-inline-icon"><MedicalIcon name="shield" /></span>Barrier</strong><span>{topPatient.barrier}</span></li>
          </ul>
        </Card>
        <CameraPrepCard patient={topPatient} title="Virtual consultation" />
      </div>
      <div className="ay-grid-2">
        <Card title="Developer feedback board">
          <ul className="ay-list">
            <li><strong>Capture page feedback</strong><span>Open the developer board from any page with source context already attached.</span></li>
            <li><strong>Generate AI prompts</strong><span>Turn workflow feedback into a ChatGPT-ready prompt customized for patient, nurse, customer, pharmacist, or admin use.</span></li>
            <li><strong>Stay user-centered</strong><span>Keep AI features aligned with real needs before implementation.</span></li>
          </ul>
          <div className="ay-actions">
            <Link className="ay-button ay-button-secondary" href={`/developer?sourceRole=home&patientId=${topPatient.id}`}>Open developer board</Link>
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
  developerSourceRole,
  developerPatientId
}: {
  initialRole?: Role;
  patientId?: string;
  developerSourceRole?: Role;
  developerPatientId?: string;
}) {
  const [selection, setSelection] = useState<EntitySelection>(null);
  const patient = useMemo(() => getPatientById(patientId), [patientId]);
  const role = initialRole;
  const feedbackHref = `/developer?sourceRole=${role}&patientId=${patient.id}`;

  return (
    <div className="ay-shell">
      <aside className="ay-sidebar">
        <Link href="/" className="ay-brand">
          <Image src="/arogyayatra-logo.png" alt="ArogyaYatra logo" width={58} height={58} />
          <div><strong>ArogyaYatra</strong><span>AI enabled Healthcare Coordinator</span></div>
        </Link>
        <nav>
          {navItems.map((item) => <Link key={item.id} href={item.href} className={role === item.id || (role === "admin" && item.id === "home") ? "active" : ""}>{item.label}</Link>)}
        </nav>
        <div className="ay-sidebar-actions">
          <Link href={feedbackHref} className="ay-sidebar-feedback">Send feedback from this page</Link>
        </div>
      </aside>
      <main className="ay-main">
        {role === "home" ? <HomeView /> : null}
        {role === "admin" ? <AdminView onSelect={setSelection} /> : null}
        {role === "patient" ? <PatientView patient={patient} /> : null}
        {role === "nurse" ? <NurseView /> : null}
        {role === "pharmacist" ? <PharmacistView /> : null}
        {role === "developer" ? <DeveloperView currentRole={role} currentPatient={patient} sourceRoleFromQuery={developerSourceRole} patientIdFromQuery={developerPatientId} /> : null}
      </main>
      <Assistant role={role} patient={patient} />
      <EntityModal selection={selection} onClose={() => setSelection(null)} />
    </div>
  );
}
