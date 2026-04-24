import { Scenario } from "@/lib/contracts";

type ScenarioLabelProps = {
  scenario: Scenario;
  compact?: boolean;
};

const LABELS: Record<Scenario, string> = {
  routine: "Routine",
  watch_closely: "Watch Closely",
  high_priority_health_shift: "High Priority Health Shift"
};

function iconForScenario(scenario: Scenario) {
  switch (scenario) {
    case "routine":
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 3v3" />
          <path d="M12 18v3" />
          <path d="M4.9 4.9l2.1 2.1" />
          <path d="M17 17l2.1 2.1" />
          <path d="M3 12h3" />
          <path d="M18 12h3" />
          <path d="M4.9 19.1L7 17" />
          <path d="M17 7l2.1-2.1" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
    case "watch_closely":
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case "high_priority_health_shift":
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 4 21 20H3L12 4Z" />
          <path d="M12 9v5" />
          <path d="M12 17h.01" />
        </svg>
      );
  }
}

export function ScenarioLabel({ scenario, compact = false }: ScenarioLabelProps) {
  return (
    <span className={`scenario-label ${compact ? "scenario-label-compact" : ""}`}>
      <span className="scenario-icon">{iconForScenario(scenario)}</span>
      <span>{LABELS[scenario]}</span>
    </span>
  );
}

