import { DemoCase, RuntimeMode, Scenario } from "@/lib/contracts";
import { MODE_LABELS, RUNTIME_MODES, SCENARIOS } from "@/lib/runtime/case-store";
import { resolveDemoCase } from "@/lib/runtime/orchestrator";
import { normalizeMode, normalizeScenario } from "@/lib/runtime/query";

export const scenarios = SCENARIOS;
export const runtimeModes = RUNTIME_MODES;
export const runtimeModeLabels = MODE_LABELS;

export function getDemoCase(scenario: string | undefined, mode: string | undefined): DemoCase {
  const normalizedScenario: Scenario = normalizeScenario(scenario);
  const normalizedMode: RuntimeMode = normalizeMode(mode);
  return resolveDemoCase(normalizedScenario, normalizedMode);
}
