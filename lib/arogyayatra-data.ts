export type Role = "home" | "admin" | "patient" | "nurse" | "pharmacist" | "developer";
export type Risk = "High priority" | "Watch closely" | "Routine";
export type AuthStatus = "active" | "invited";

export type AccountProfile = {
  email: string;
  username: string;
  phone: string;
  authStatus: AuthStatus;
  lastLoginAt: string;
};

export type Patient = {
  id: string;
  name: string;
  account: AccountProfile;
  diagnosis: string;
  risk: Risk;
  dischargeHoursAgo: number;
  critical: boolean;
  nurse: string;
  pharmacist: string;
  medication: string;
  refillStatus: string;
  barrier: string;
  nextAction: string;
  appointment: string;
  messages: number;
  journeyStage: "Intake" | "Assessment" | "Treatment" | "Monitoring" | "Recovery";
  vitals: Array<{ label: string; value: string; note: string }>;
  history: string[];
};

export type Nurse = {
  id: string;
  name: string;
  account: AccountProfile;
  specialty: string;
  shift: string;
  responseMinutes: number;
};

export type Pharmacist = {
  id: string;
  name: string;
  account: AccountProfile;
  focus: string;
  queueSize: number;
  fillsToday: number;
};

export type AdminUser = {
  id: string;
  name: string;
  account: AccountProfile;
  title: string;
  scope: string;
};

export type DeveloperUser = {
  id: string;
  name: string;
  account: AccountProfile;
  title: string;
  focus: string;
};

export type AuthUserSeed = {
  id: string;
  role: Exclude<Role, "home">;
  name: string;
  email: string;
  username: string;
  phone: string;
  authStatus: AuthStatus;
  lastLoginAt: string;
  linkedEntityId: string;
  scopeSummary: string;
};

export const nurses: Nurse[] = [
  {
    id: "NU-201",
    name: "Sarah Johnson",
    account: {
      email: "sarah.johnson@arogyayatra.health",
      username: "sarah.johnson",
      phone: "+1 (555) 201-1001",
      authStatus: "active",
      lastLoginAt: "2026-04-24T21:10:00-04:00"
    },
    specialty: "Cardiac recovery",
    shift: "07:00-15:00",
    responseMinutes: 11
  },
  {
    id: "NU-202",
    name: "Michael Brown",
    account: {
      email: "michael.brown@arogyayatra.health",
      username: "michael.brown",
      phone: "+1 (555) 202-1002",
      authStatus: "active",
      lastLoginAt: "2026-04-24T20:42:00-04:00"
    },
    specialty: "Respiratory follow-up",
    shift: "07:00-15:00",
    responseMinutes: 13
  },
  {
    id: "NU-203",
    name: "Priya Menon",
    account: {
      email: "priya.menon@arogyayatra.health",
      username: "priya.menon",
      phone: "+1 (555) 203-1003",
      authStatus: "active",
      lastLoginAt: "2026-04-24T19:58:00-04:00"
    },
    specialty: "Post-surgical and chronic care",
    shift: "08:00-16:00",
    responseMinutes: 10
  }
];

export const pharmacists: Pharmacist[] = [
  {
    id: "PH-301",
    name: "Olivia Martin",
    account: {
      email: "olivia.martin@arogyayatra.health",
      username: "olivia.martin",
      phone: "+1 (555) 301-2001",
      authStatus: "active",
      lastLoginAt: "2026-04-24T18:40:00-04:00"
    },
    focus: "Medication reconciliation",
    queueSize: 2,
    fillsToday: 7
  },
  {
    id: "PH-302",
    name: "Ethan Cole",
    account: {
      email: "ethan.cole@arogyayatra.health",
      username: "ethan.cole",
      phone: "+1 (555) 302-2002",
      authStatus: "active",
      lastLoginAt: "2026-04-24T18:15:00-04:00"
    },
    focus: "Insurance authorization and refill access",
    queueSize: 2,
    fillsToday: 5
  }
];

export const patients: Patient[] = [
  {
    id: "PT-1001",
    name: "Maya Rivera",
    account: {
      email: "maya.rivera@example.com",
      username: "maya.rivera",
      phone: "+1 (555) 401-3001",
      authStatus: "active",
      lastLoginAt: "2026-04-24T20:05:00-04:00"
    },
    diagnosis: "CHF with fluid retention",
    risk: "Watch closely",
    dischargeHoursAgo: 18,
    critical: true,
    nurse: "Sarah Johnson",
    pharmacist: "Olivia Martin",
    medication: "Furosemide 40mg",
    refillStatus: "Pickup delayed",
    barrier: "Missed refill pickup",
    nextAction: "Call within 30 min",
    appointment: "Today 02:30 PM cardiology",
    messages: 3,
    journeyStage: "Monitoring",
    vitals: [
      { label: "Weight", value: "58 kg", note: "Stable from yesterday" },
      { label: "Heart rate", value: "70 bpm", note: "Within tracked range" },
      { label: "Blood glucose", value: "4.5 mmol/L", note: "No alert triggered" },
      { label: "Oxygen saturation", value: "96%", note: "Review by noon" }
    ],
    history: [
      "2022: Heart failure admission with fluid overload; Furosemide and low-sodium coaching started.",
      "2024: Dizziness review; Metoprolol adjusted and daily weight tracking added.",
      "2025: Current transition bundle; Furosemide 40mg with pharmacy pickup backup."
    ]
  },
  {
    id: "PT-1002",
    name: "James Thornton",
    account: {
      email: "james.thornton@example.com",
      username: "james.thornton",
      phone: "+1 (555) 402-3002",
      authStatus: "active",
      lastLoginAt: "2026-04-24T17:48:00-04:00"
    },
    diagnosis: "Post-acute chest pain follow-up",
    risk: "High priority",
    dischargeHoursAgo: 12,
    critical: true,
    nurse: "Michael Brown",
    pharmacist: "Ethan Cole",
    medication: "Metoprolol 25mg",
    refillStatus: "Insurance hold",
    barrier: "Symptom escalation reported overnight",
    nextAction: "Immediate nurse escalation",
    appointment: "Today 11:00 AM tele-triage",
    messages: 4,
    journeyStage: "Assessment",
    vitals: [
      { label: "Blood pressure", value: "152/92", note: "Above personal baseline" },
      { label: "Heart rate", value: "88 bpm", note: "Monitor closely" },
      { label: "Oxygen saturation", value: "93%", note: "Escalation threshold reached" },
      { label: "Pain score", value: "6/10", note: "Reassess during call" }
    ],
    history: [
      "2023: Cardiac observation stay; beta blocker education provided.",
      "2025: Post-discharge chest pain callback required."
    ]
  },
  {
    id: "PT-1003",
    name: "Margaret Ellis",
    account: {
      email: "margaret.ellis@example.com",
      username: "margaret.ellis",
      phone: "+1 (555) 403-3003",
      authStatus: "active",
      lastLoginAt: "2026-04-24T16:35:00-04:00"
    },
    diagnosis: "Post-surgical wound review",
    risk: "Routine",
    dischargeHoursAgo: 28,
    critical: false,
    nurse: "Priya Menon",
    pharmacist: "Olivia Martin",
    medication: "Cephalexin 500mg",
    refillStatus: "On hand",
    barrier: "None",
    nextAction: "Recheck symptoms tomorrow",
    appointment: "Tomorrow 09:00 AM wound clinic",
    messages: 1,
    journeyStage: "Recovery",
    vitals: [
      { label: "Temperature", value: "98.2 F", note: "Stable" },
      { label: "Pain score", value: "2/10", note: "Improving" },
      { label: "Mobility", value: "Assisted", note: "Walker support" },
      { label: "Wound check", value: "Clean", note: "No drainage alert" }
    ],
    history: ["2024: Knee procedure recovery; short antibiotic course completed."]
  }
];

export const admins: AdminUser[] = [
  {
    id: "AD-101",
    name: "Anita Patel",
    account: {
      email: "anita.patel@arogyayatra.health",
      username: "anita.patel",
      phone: "+1 (555) 101-9001",
      authStatus: "active",
      lastLoginAt: "2026-04-24T21:20:00-04:00"
    },
    title: "Care Operations Lead",
    scope: "Priority coordination, staffing, and workflow oversight"
  }
];

export const developers: DeveloperUser[] = [
  {
    id: "DV-101",
    name: "Neeraj Gupta",
    account: {
      email: "neeraj.gupta@arogyayatra.health",
      username: "neeraj.gupta",
      phone: "+1 (555) 111-9501",
      authStatus: "active",
      lastLoginAt: "2026-04-24T22:05:00-04:00"
    },
    title: "Platform Developer",
    focus: "Agent runtime, care coordination UX, and safe automation"
  }
];

export const authUsers: AuthUserSeed[] = [
  ...admins.map((admin) => ({
    id: `AUTH-${admin.id}`,
    role: "admin" as const,
    name: admin.name,
    email: admin.account.email,
    username: admin.account.username,
    phone: admin.account.phone,
    authStatus: admin.account.authStatus,
    lastLoginAt: admin.account.lastLoginAt,
    linkedEntityId: admin.id,
    scopeSummary: admin.scope
  })),
  ...developers.map((developer) => ({
    id: `AUTH-${developer.id}`,
    role: "developer" as const,
    name: developer.name,
    email: developer.account.email,
    username: developer.account.username,
    phone: developer.account.phone,
    authStatus: developer.account.authStatus,
    lastLoginAt: developer.account.lastLoginAt,
    linkedEntityId: developer.id,
    scopeSummary: developer.focus
  })),
  ...patients.map((patient) => ({
    id: `AUTH-${patient.id}`,
    role: "patient" as const,
    name: patient.name,
    email: patient.account.email,
    username: patient.account.username,
    phone: patient.account.phone,
    authStatus: patient.account.authStatus,
    lastLoginAt: patient.account.lastLoginAt,
    linkedEntityId: patient.id,
    scopeSummary: `Own patient record for ${patient.name}`
  })),
  ...nurses.map((nurse) => ({
    id: `AUTH-${nurse.id}`,
    role: "nurse" as const,
    name: nurse.name,
    email: nurse.account.email,
    username: nurse.account.username,
    phone: nurse.account.phone,
    authStatus: nurse.account.authStatus,
    lastLoginAt: nurse.account.lastLoginAt,
    linkedEntityId: nurse.id,
    scopeSummary: `Assigned patient panel for ${nurse.name}`
  })),
  ...pharmacists.map((pharmacist) => ({
    id: `AUTH-${pharmacist.id}`,
    role: "pharmacist" as const,
    name: pharmacist.name,
    email: pharmacist.account.email,
    username: pharmacist.account.username,
    phone: pharmacist.account.phone,
    authStatus: pharmacist.account.authStatus,
    lastLoginAt: pharmacist.account.lastLoginAt,
    linkedEntityId: pharmacist.id,
    scopeSummary: `Medication queue and linked patients for ${pharmacist.name}`
  }))
];

export const journeyStages = ["Intake", "Assessment", "Treatment", "Monitoring", "Recovery"] as const;

export const agentCapabilities = [
  { name: "Patient context agent", detail: "Summarizes discharge plan, history, and active recovery stage." },
  { name: "Monitoring agent", detail: "Checks vitals, symptoms, and escalation triggers." },
  { name: "Nurse workload agent", detail: "Balances daily load and flags heavy queues." },
  { name: "Pharmacy agent", detail: "Tracks refill blockers, fills, insurance, and pickup issues." },
  { name: "Coordinator agent", detail: "Combines signals into next best coordination action." },
  { name: "Chatbot agent", detail: "Answers user questions from page context and patient history." }
];

export function riskRank(risk: Risk): number {
  return risk === "High priority" ? 3 : risk === "Watch closely" ? 2 : 1;
}

export function getPatientById(patientId: string): Patient {
  return patients.find((patient) => patient.id === patientId) ?? patients[0];
}

export function patientsForNurse(name: string): Patient[] {
  return patients.filter((patient) => patient.nurse === name);
}

export function patientsForPharmacist(name: string): Patient[] {
  return patients.filter((patient) => patient.pharmacist === name);
}

export function priorityPatients(): Patient[] {
  return [...patients].sort((a, b) => {
    const scoreA = (a.critical ? 200 : 0) + riskRank(a.risk) * 40 + Math.max(0, 72 - a.dischargeHoursAgo) + a.messages * 2;
    const scoreB = (b.critical ? 200 : 0) + riskRank(b.risk) * 40 + Math.max(0, 72 - b.dischargeHoursAgo) + b.messages * 2;
    return scoreB - scoreA;
  });
}

export function priorityNurses(): Nurse[] {
  return [...nurses].sort((a, b) => {
    const aPatients = patientsForNurse(a.name);
    const bPatients = patientsForNurse(b.name);
    const aScore = aPatients.length * 30 + aPatients.filter((patient) => patient.risk !== "Routine").length * 25 + a.responseMinutes;
    const bScore = bPatients.length * 30 + bPatients.filter((patient) => patient.risk !== "Routine").length * 25 + b.responseMinutes;
    return bScore - aScore;
  });
}

export function priorityPharmacists(): Pharmacist[] {
  return [...pharmacists].sort((a, b) => {
    const aPatients = patientsForPharmacist(a.name);
    const bPatients = patientsForPharmacist(b.name);
    const aPending = aPatients.filter((patient) => !/on hand/i.test(patient.refillStatus)).length;
    const bPending = bPatients.filter((patient) => !/on hand/i.test(patient.refillStatus)).length;
    return bPending * 40 + b.queueSize * 20 + b.fillsToday - (aPending * 40 + a.queueSize * 20 + a.fillsToday);
  });
}

export function answerCareQuestion(role: Role, patientId: string, question: string): { answer: string; agentsUsed: string[] } {
  const patient = getPatientById(patientId);
  const q = question.toLowerCase();

  if (/history|earlier|heart failure|medication/.test(q)) {
    return {
      answer: patient.history.join(" "),
      agentsUsed: ["Patient context agent", "Chatbot agent"]
    };
  }

  if (/priority|critical|first|review/.test(q)) {
    const top = priorityPatients()[0];
    return {
      answer: `${top.name} is the highest-priority patient because of ${top.risk.toLowerCase()} status, ${top.dischargeHoursAgo} hours since discharge, and current blocker: ${top.barrier}. Next action: ${top.nextAction}.`,
      agentsUsed: ["Monitoring agent", "Coordinator agent"]
    };
  }

  if (/nurse|load|queue/.test(q)) {
    const summary = priorityNurses()
      .map((nurse) => `${nurse.name}: ${patientsForNurse(nurse.name).length} active patient(s), ${nurse.responseMinutes}m response.`)
      .join(" ");
    return {
      answer: summary,
      agentsUsed: ["Nurse workload agent", "Coordinator agent"]
    };
  }

  if (/pharmac|refill|fill|medicine|pickup|insurance/.test(q)) {
    const summary = priorityPharmacists()
      .map((pharmacist) => `${pharmacist.name}: ${pharmacist.fillsToday} fills today, ${pharmacist.queueSize} open queue item(s).`)
      .join(" ");
    return {
      answer: summary,
      agentsUsed: ["Pharmacy agent", "Coordinator agent"]
    };
  }

  return {
    answer:
      role === "patient"
        ? `${patient.name}'s current plan is ${patient.nextAction}. Medication: ${patient.medication}. Refill status: ${patient.refillStatus}.`
        : "The coordinator can answer questions about priority patients, nurse workload, pharmacy refills, appointments, and patient history from the current ArogyaYatra dataset.",
    agentsUsed: ["Chatbot agent", "Coordinator agent"]
  };
}
