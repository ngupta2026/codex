import { CaseInput, RuntimeMode, Scenario } from "@/lib/contracts";

export const SCENARIOS: Scenario[] = ["routine", "watch_closely", "high_priority_health_shift"];
export const RUNTIME_MODES: RuntimeMode[] = ["local_deterministic", "live_tools_mode", "orchestrate_rest_api"];

export const MODE_LABELS: Record<RuntimeMode, "Local deterministic" | "Live watsonx tools" | "Orchestrate REST API"> = {
  local_deterministic: "Local deterministic",
  live_tools_mode: "Live watsonx tools",
  orchestrate_rest_api: "Orchestrate REST API"
};

const SCENARIO_INPUTS: Record<Scenario, CaseInput> = {
  routine: {
    case_id: "CASE-RT-1001",
    patient_id: "PT-1001",
    patient_name: "Margaret Ellis",
    symptom_report: "A little tired after walking, but no fever and breathing is normal.",
    vitals_snapshot: {
      oxygen_saturation_pct: 96,
      heart_rate_bpm: 84,
      temperature_f: 98.5
    },
    discharge_instructions: [
      "Take furosemide 20 mg in the morning.",
      "Check weight daily before breakfast.",
      "Follow low-sodium meal plan."
    ],
    medication_status: {
      current_medications: ["Furosemide 20 mg daily", "Lisinopril 10 mg daily"],
      refill_state: ["Furosemide refill ready for pickup"],
      adherence_barriers: [],
      pickup_or_delivery_issues: []
    },
    appointments: {
      scheduled: ["Cardiology follow-up tomorrow at 10:30 AM"],
      pending: [],
      missed: []
    },
    transport_access: {
      status: "confirmed",
      constraints: []
    },
    pharmacy_refill_status: {
      status: "on_track",
      notes: ["Refill processed successfully"]
    }
  },
  watch_closely: {
    case_id: "CASE-WC-2002",
    patient_id: "PT-2002",
    patient_name: "David Ramirez",
    symptom_report: "My leg is more swollen and I missed my antibiotic pickup.",
    vitals_snapshot: {
      oxygen_saturation_pct: 93,
      heart_rate_bpm: 97,
      temperature_f: 99.4
    },
    discharge_instructions: [
      "Take cephalexin 500 mg four times daily.",
      "Elevate the affected leg while resting.",
      "Recheck temperature every evening."
    ],
    medication_status: {
      current_medications: ["Cephalexin 500 mg", "Acetaminophen 500 mg as needed"],
      refill_state: ["Primary pharmacy stock-out for cephalexin"],
      adherence_barriers: ["Missed pickup may cause delayed dose"],
      pickup_or_delivery_issues: ["Needs alternate same-day pickup location"]
    },
    appointments: {
      scheduled: ["Primary care follow-up today at 4:00 PM"],
      pending: ["Transport confirmation pending"],
      missed: []
    },
    transport_access: {
      status: "pending_confirmation",
      constraints: ["No confirmed ride to follow-up appointment"]
    },
    pharmacy_refill_status: {
      status: "delayed",
      notes: ["Transfer to alternate pharmacy is available"]
    }
  },
  high_priority_health_shift: {
    case_id: "CASE-HP-3003",
    patient_id: "PT-3003",
    patient_name: "Maya Rivera",
    symptom_report: "I feel short of breath and dizzy this morning.",
    vitals_snapshot: {
      oxygen_saturation_pct: 89,
      heart_rate_bpm: 112,
      temperature_f: 99.9
    },
    discharge_instructions: [
      "Continue baseline medications unless nurse provides updated instructions.",
      "Report breathing changes immediately."
    ],
    medication_status: {
      current_medications: ["Amoxicillin 500 mg", "Metoprolol 25 mg"],
      refill_state: ["Amoxicillin ready by noon"],
      adherence_barriers: [],
      pickup_or_delivery_issues: []
    },
    appointments: {
      scheduled: ["Cardiology check today at 2:30 PM"],
      pending: [],
      missed: []
    },
    transport_access: {
      status: "in_progress",
      constraints: []
    },
    pharmacy_refill_status: {
      status: "in_progress",
      notes: ["No refill blocker currently reported"]
    }
  }
};

export function getScenarioInput(scenario: Scenario): CaseInput {
  return SCENARIO_INPUTS[scenario];
}
