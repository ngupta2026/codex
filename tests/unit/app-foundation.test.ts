import { describe, expect, it } from "vitest";
import {
  APP_ROLE_MODEL,
  ARCHITECTURE_BOUNDARIES,
  JOURNEY_STAGE_MODEL,
  isAppRole,
  isJourneyStage
} from "@/lib/app-foundation";

describe("app foundation", () => {
  it("defines the supported role model", () => {
    expect(APP_ROLE_MODEL).toEqual(["home", "admin", "patient", "nurse", "pharmacist", "developer", "feedback"]);
    expect(isAppRole("developer")).toBe(true);
    expect(isAppRole("unknown")).toBe(false);
  });

  it("defines the supported journey stage model", () => {
    expect(JOURNEY_STAGE_MODEL).toEqual(["Intake", "Assessment", "Treatment", "Monitoring", "Recovery"]);
    expect(isJourneyStage("Monitoring")).toBe(true);
    expect(isJourneyStage("Unknown")).toBe(false);
  });

  it("keeps policy as the only boundary that can write journey state", () => {
    expect(ARCHITECTURE_BOUNDARIES.find((entry) => entry.kind === "deterministic_policy")?.canWriteJourneyState).toBe(true);
    expect(ARCHITECTURE_BOUNDARIES.filter((entry) => entry.kind !== "deterministic_policy").every((entry) => entry.canWriteJourneyState === false)).toBe(true);
  });
});
