import { RuntimeMode, Scenario } from "@/lib/contracts";
import { RUNTIME_MODES, SCENARIOS } from "@/lib/runtime/case-store";

export function normalizeScenario(scenario: string | undefined): Scenario {
  return SCENARIOS.includes(scenario as Scenario) ? (scenario as Scenario) : "routine";
}

export function normalizeMode(mode: string | undefined): RuntimeMode {
  return RUNTIME_MODES.includes(mode as RuntimeMode) ? (mode as RuntimeMode) : "local_deterministic";
}

export function buildRoleHref(pathname: string, scenario: Scenario, mode: RuntimeMode): string {
  const params = new URLSearchParams({
    scenario,
    mode
  });
  return `${pathname}?${params.toString()}`;
}
