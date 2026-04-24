"use client";

import Link from "next/link";
import { useState } from "react";
import { DemoCase, RuntimeMode, Scenario } from "@/lib/contracts";
import { RiskBadge } from "@/components/RiskBadge";
import { RoleIconLabel } from "@/components/RoleIconLabel";
import { ScenarioLabel } from "@/components/ScenarioLabel";
import { SectionCard } from "@/components/SectionCard";

type HomeDashboardProps = {
  initialScenario: Scenario;
  mode: RuntimeMode;
  cases: DemoCase[];
};

function firstFinding(matchers: string[], values: string[], fallback: string): string {
  const found = values.find((item) => matchers.some((matcher) => item.toLowerCase().includes(matcher)));
  return found ?? fallback;
}

export function HomeDashboard({ initialScenario, mode, cases }: HomeDashboardProps) {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(initialScenario);
  const currentCase = cases.find((item) => item.scenario === selectedScenario) ?? cases[0];

  return (
    <>
      <div className="hero-grid">
        <SectionCard title="Care Overview">
          <p>
            Care coordination stays simple on the page. Clinical logic runs in the background while the interface keeps
            focus on patient progress, next actions, and current health status.
          </p>
          <div className="chip-group">
            <span className="chip chip-active">{currentCase.patient_name}</span>
            <span className="chip">{currentCase.execution_mode}</span>
            <span className="chip">
              <ScenarioLabel scenario={currentCase.scenario} compact />
            </span>
          </div>
        </SectionCard>

        <SectionCard title="Current Care Status" accent={currentCase.response.escalation_required ? "warning" : "success"}>
          <div className="stack-tight">
            <div className="row-between">
              <RiskBadge riskStatus={currentCase.response.risk_status} />
              <span className="text-faint">{currentCase.case_id}</span>
            </div>
            <p>{currentCase.response.clinician_summary}</p>
            <div className="grid-2 compact-grid">
              {currentCase.response.key_findings.slice(0, 4).map((item) => (
                <div key={item} className="stat">
                  <label>Current Signal</label>
                  <strong>{item}</strong>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="hero-grid">
        <SectionCard title="Patient Follow-Up">
          <ul className="list">
            {currentCase.response.immediate_actions.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Vital Health Snapshot" accent="success">
          <div className="grid-3 compact-grid">
            <div className="stat">
              <label>Oxygen Saturation</label>
              <strong>{firstFinding(["oxygen", "sat"], currentCase.response.key_findings, "Stable in current review")}</strong>
            </div>
            <div className="stat">
              <label>Heart Rate</label>
              <strong>{firstFinding(["heart", "pulse"], currentCase.response.key_findings, "Within tracked range")}</strong>
            </div>
            <div className="stat">
              <label>Temperature</label>
              <strong>{firstFinding(["temp", "temperature"], currentCase.response.key_findings, "No urgent temperature shift")}</strong>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid-3">
        {cases.map((payload) => {
          const queryString = `?scenario=${payload.scenario}&mode=${mode}`;
          const isSelected = payload.scenario === currentCase.scenario;

          return (
            <div
              key={payload.scenario}
              className={`care-path-card ${isSelected ? "care-path-card-active" : ""}`}
              onMouseEnter={() => setSelectedScenario(payload.scenario)}
              onFocus={() => setSelectedScenario(payload.scenario)}
            >
              <SectionCard title={payload.patient_name} accent={isSelected ? "success" : "neutral"}>
                <div className="stack-tight">
                  <div className="row-between">
                    <ScenarioLabel scenario={payload.scenario} />
                    <span className="text-faint">{payload.case_id}</span>
                  </div>
                  <p>{payload.symptom_report}</p>
                  <div className="chip-group">
                    <span className="chip chip-active">{payload.response.risk_status.replaceAll("_", " ")}</span>
                    <span className="chip">{payload.execution_mode}</span>
                  </div>
                  <div className="cta-row">
                    <Link href={`/patient/${payload.patient_id}${queryString}`} className="btn btn-primary">
                      <RoleIconLabel role="patient" label="Patient board" compact />
                    </Link>
                    <Link href={`/nurse${queryString}`} className="btn btn-secondary">
                      <RoleIconLabel role="nurse" label="Nurse board" compact />
                    </Link>
                    <Link href={`/pharmacist${queryString}`} className="btn btn-secondary">
                      <RoleIconLabel role="pharmacist" label="Pharmacy board" compact />
                    </Link>
                  </div>
                </div>
              </SectionCard>
            </div>
          );
        })}
      </div>
    </>
  );
}

