import Link from "next/link";

type TopNavProps = {
  scenario: string;
};

export function TopNav({ scenario }: TopNavProps) {
  const suffix = `?scenario=${encodeURIComponent(scenario)}`;
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-sm font-bold text-brand-ink">
          Care Coordinator Demo
        </Link>
        <nav className="flex gap-2 text-sm">
          <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href={`/patient/PT-1001${suffix}`}>
            Patient
          </Link>
          <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href={`/nurse${suffix}`}>
            Nurse
          </Link>
          <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href={`/pharmacist${suffix}`}>
            Pharmacist
          </Link>
        </nav>
      </div>
    </header>
  );
}
