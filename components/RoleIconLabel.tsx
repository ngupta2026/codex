import { ReactNode } from "react";

type RoleKey = "home" | "patient" | "nurse" | "pharmacist";

type RoleIconLabelProps = {
  role: RoleKey;
  label: string;
  compact?: boolean;
};

function iconForRole(role: RoleKey): ReactNode {
  switch (role) {
    case "home":
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 11.5L12 4l9 7.5" />
          <path d="M5.5 10.5V20h13V10.5" />
        </svg>
      );
    case "patient":
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="7.5" r="3.5" />
          <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
        </svg>
      );
    case "nurse":
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 4v6" />
          <path d="M9 7h6" />
          <path d="M5 19c0-4 3-7 7-7s7 3 7 7" />
        </svg>
      );
    case "pharmacist":
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="5" y="6" width="14" height="13" rx="2" />
          <path d="M12 9v7" />
          <path d="M8.5 12.5h7" />
        </svg>
      );
    default:
      return null;
  }
}

export function RoleIconLabel({ role, label, compact = false }: RoleIconLabelProps) {
  const iconFrameClass = compact
    ? "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-black/5"
    : "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-black/5";
  const wrapperClass = compact
    ? "inline-flex items-center justify-center gap-1 whitespace-nowrap text-[0.72rem] leading-none"
    : "inline-flex items-center gap-2 whitespace-nowrap leading-none";

  return (
    <span className={`icon-label ${wrapperClass}`}>
      <span className={iconFrameClass}>{iconForRole(role)}</span>
      <span>{label}</span>
    </span>
  );
}
