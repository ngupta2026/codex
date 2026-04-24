import Link from "next/link";
import { ReactNode } from "react";
import { RuntimeMode, Scenario } from "@/lib/contracts";
import { runtimeModeLabels, runtimeModes, scenarios } from "@/lib/demo-data";
import { buildRoleHref } from "@/lib/runtime/query";
import { RoleIconLabel } from "@/components/RoleIconLabel";
import { ScenarioLabel } from "@/components/ScenarioLabel";
import { ThemeToggle } from "@/components/ThemeToggle";

type Role = "home" | "patient" | "nurse" | "pharmacist";

type AppShellProps = {
  role: Role;
  scenario: Scenario;
  mode: RuntimeMode;
  patientId?: string;
  heading: string;
  subtitle: string;
  children: ReactNode;
};

function navClass(isActive: boolean): string {
  return `shell-nav-link ${isActive ? "active" : ""}`;
}

function chipClass(isActive: boolean): string {
  return `chip ${isActive ? "chip-active" : ""}`;
}

export function AppShell({ role, scenario, mode, patientId, heading, subtitle, children }: AppShellProps) {
  const patientPath = `/patient/${encodeURIComponent(patientId ?? "PT-1001")}`;

  const links = [
    { id: "home", label: "Home", href: buildRoleHref("/", scenario, mode), iconRole: "home" },
    { id: "patient", label: "Patient", href: buildRoleHref(patientPath, scenario, mode), iconRole: "patient" },
    { id: "nurse", label: "Nurse", href: buildRoleHref("/nurse", scenario, mode), iconRole: "nurse" },
    {
      id: "pharmacist",
      label: "Pharmacy",
      href: buildRoleHref("/pharmacist", scenario, mode),
      iconRole: "pharmacist"
    }
  ] as const;

  return (
    <div className="shell relative overflow-x-clip">
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-32 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-40 top-8 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl" />
      <aside className="sidebar">
        <div className="brand">
          <div className="logo" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path d="M12 3v18" />
              <path d="M5 9c0-2.5 2-4 4.5-4H12v8H9.5C7 13 5 11.5 5 9Z" />
              <path d="M19 15c0 2.5-2 4-4.5 4H12v-8h2.5c2.5 0 4.5 1.5 4.5 4Z" />
            </svg>
          </div>
          <div>
            <h1>Virtual Care Coordinator</h1>
            <p>Role-based post-discharge coordination</p>
          </div>
        </div>

        <nav className="shell-nav" aria-label="Dashboard navigation">
          {links.map((item) => (
            <Link key={item.id} href={item.href} className={navClass(role === item.id)}>
              <RoleIconLabel role={item.iconRole} label={item.label} />
            </Link>
          ))}
        </nav>

        <ThemeToggle />
      </aside>

      <main className="shell-main relative">
        <header className="page-header">
          <div>
            <span className="eyebrow">{role === "home" ? "Landing homepage" : `${role} board`}</span>
            <h2>{heading}</h2>
            <p>{subtitle}</p>
          </div>
          <div className="header-meta">
            <div className="chip-group">
              {runtimeModes.map((entry) => (
                <Link
                  key={entry}
                  href={buildRoleHref(role === "patient" ? patientPath : `/${role === "home" ? "" : role}`, scenario, entry)}
                  className={chipClass(mode === entry)}
                >
                  {runtimeModeLabels[entry]}
                </Link>
              ))}
            </div>
            <div className="chip-group">
              {scenarios.map((entry) => (
                <Link
                  key={entry}
                  href={buildRoleHref(role === "patient" ? patientPath : `/${role === "home" ? "" : role}`, entry, mode)}
                  className={chipClass(scenario === entry)}
                >
                  <ScenarioLabel scenario={entry} compact />
                </Link>
              ))}
            </div>
          </div>
        </header>

        <section className="page-content pb-5">{children}</section>
      </main>
    </div>
  );
}
