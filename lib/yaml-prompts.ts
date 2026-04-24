import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const YAML_FILES = [
  "agents.yaml",
  "tasks.yaml",
  "architecture.yaml",
  "mixed_architecture_blueprint.yaml",
  "safety_governance.yaml",
  "tool_contracts.yaml",
  "workflow_orchestration.yaml"
] as const;

export type PromptConfigSummary = {
  projectName: string;
  architectureMode: string;
  riskSignals: string[];
  executionModes: string[];
  files: Array<{
    file: string;
    loaded: boolean;
    keys: string[];
  }>;
};

type SafetyGovernanceYaml = {
  risk_rules?: {
    concerning_signals?: string[];
  };
};

type MixedArchitectureYaml = {
  architecture_mode?: string;
};

type WorkflowYaml = {
  execution_modes?: Array<{
    name?: string;
  }>;
};

export function loadPromptConfigSummary(): PromptConfigSummary {
  const root = path.resolve(process.cwd(), "..", "projects", "virtual_care_coordinator");
  let safety: SafetyGovernanceYaml = {};
  let mixed: MixedArchitectureYaml = {};
  let workflow: WorkflowYaml = {};

  const files = YAML_FILES.map((file) => {
    const full = path.join(root, file);
    let exists = false;
    try {
      exists = fs.existsSync(full);
    } catch {
      exists = false;
    }

    if (!exists) {
      return { file, loaded: false, keys: [] };
    }

    let parsed: unknown;
    try {
      parsed = yaml.load(fs.readFileSync(full, "utf-8"));
    } catch {
      return { file, loaded: false, keys: [] };
    }

    if (file === "safety_governance.yaml" && parsed && typeof parsed === "object") {
      safety = parsed as SafetyGovernanceYaml;
    }
    if (file === "mixed_architecture_blueprint.yaml" && parsed && typeof parsed === "object") {
      mixed = parsed as MixedArchitectureYaml;
    }
    if (file === "workflow_orchestration.yaml" && parsed && typeof parsed === "object") {
      workflow = parsed as WorkflowYaml;
    }

    const keys = parsed && typeof parsed === "object" ? Object.keys(parsed as Record<string, unknown>) : [];
    return { file, loaded: true, keys };
  });

  return {
    projectName: "Virtual Care Coordinator",
    architectureMode: mixed.architecture_mode ?? "heterogeneous_mixed_agents",
    riskSignals: safety.risk_rules?.concerning_signals ?? [],
    executionModes: (workflow.execution_modes ?? []).map((entry) => entry.name ?? "").filter(Boolean),
    files
  };
}
