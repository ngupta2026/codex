import { describe, expect, it } from "vitest";
import { MISSING_VALUE } from "@/lib/contracts";
import { normalizeList, normalizeText } from "@/lib/runtime/normalizers";
import { EscalationPolicyEngine } from "@/lib/runtime/policy";

describe("runtime normalizers", () => {
  it("normalizes empty text and lists to the shared missing value", () => {
    expect(normalizeText("")).toBe(MISSING_VALUE);
    expect(normalizeList(undefined)).toEqual([MISSING_VALUE]);
    expect(normalizeList(["  take meds  ", ""])).toEqual(["take meds", MISSING_VALUE]);
  });
});

describe("policy engine", () => {
  const policy = new EscalationPolicyEngine();

  it("upgrades routine cases with medication or logistics barriers", () => {
    const output = policy.evaluate(
      {
        triage_level: "routine",
        concerning_signals: ["no_critical_signal_detected"],
        recommended_action: "Continue routine recovery plan.",
        escalate_to_nurse: false
      },
      {
        medication_status: ["Pickup delayed"],
        appointment_status: ["Cardiology follow-up"],
        resolved_actions: ["Generated same-day logistics recovery actions."],
        barriers: ["Transport barrier for required follow-up."]
      },
      {
        medication_reconciliation: ["Furosemide 40mg"],
        refill_status: ["Pickup delayed"],
        adherence_barriers: ["Missed pickup"],
        issue_flags: ["Pickup delayed"],
        delivery_pickup_issues: ["Pickup delayed"],
        patient_contact_status: "Same-day outreach recommended",
        medication_action_queue: ["Resolve refill or transfer barrier."]
      }
    );

    expect(output.effective_status).toBe("watch_closely");
    expect(output.policy_triggers).toContain("barrier_override_watch_closely");
    expect(output.policy_triggers).toContain("same_day_recheck_required");
  });

  it("keeps high-priority cases escalated", () => {
    const output = policy.evaluate(
      {
        triage_level: "high_priority_health_shift",
        concerning_signals: ["shortness_of_breath"],
        recommended_action: "Escalate to nurse immediately.",
        escalate_to_nurse: true
      },
      {
        medication_status: [],
        appointment_status: [],
        resolved_actions: ["No logistical barriers detected."],
        barriers: []
      },
      {
        medication_reconciliation: [],
        refill_status: [],
        adherence_barriers: [],
        issue_flags: [],
        delivery_pickup_issues: [],
        patient_contact_status: "Routine reminder cadence",
        medication_action_queue: ["Send standard adherence reminder."]
      }
    );

    expect(output.effective_status).toBe("high_priority_health_shift");
    expect(output.escalated).toBe(true);
    expect(output.policy_triggers).toContain("human_escalation_required");
  });
});
