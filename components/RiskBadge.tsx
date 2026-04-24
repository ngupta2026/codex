import { RiskStatus } from "@/lib/contracts";

const STYLE: Record<RiskStatus, string> = {
  routine: "b-success",
  watch_closely: "b-warning",
  high_priority_health_shift: "b-error"
};

export function RiskBadge({ riskStatus }: { riskStatus: RiskStatus }) {
  return <span className={`badge ${STYLE[riskStatus]}`}>{riskStatus.replaceAll("_", " ")}</span>;
}
