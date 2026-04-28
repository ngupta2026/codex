import { describe, expect, it } from "vitest";
import { runAgenticChat } from "@/lib/runtime/chat-orchestrator";

describe("runAgenticChat", () => {
  it("returns the Phase 1 architecture envelope fields", () => {
    const response = runAgenticChat({
      role: "admin",
      patientId: "PT-1001",
      question: "What should I review first?"
    });

    expect(response.mode).toBe("agentic_coordinator_v1");
    expect(response.decisionBoundaries.length).toBeGreaterThanOrEqual(3);
    expect(response.journeyModel).toEqual(["Intake", "Assessment", "Treatment", "Monitoring", "Recovery"]);
    expect(response.trace.length).toBeGreaterThan(0);
    expect(response.traceEvents.length).toBe(response.trace.length);
    expect(response.review.passed).toBe(true);
  });

  it("selects pharmacy-oriented behavior for refill questions", () => {
    const response = runAgenticChat({
      role: "pharmacist",
      patientId: "PT-1001",
      question: "Show refill and pickup blockers"
    });

    expect(response.agentsUsed).toContain("Pharmacy agent");
    expect(response.answer.toLowerCase()).toContain("fills today");
    expect(response.facts.some((fact) => fact.label === "Refill status")).toBe(true);
  });
});
