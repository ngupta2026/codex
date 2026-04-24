import { ArogyaYatraDashboard } from "@/components/ArogyaYatraDashboard";
import type { Role } from "@/lib/arogyayatra-data";

type Props = {
  searchParams?: Promise<{ sourceRole?: string; patientId?: string }>;
};

export default async function DeveloperPage({ searchParams }: Props) {
  const query = (searchParams ? await searchParams : undefined) ?? {};
  const sourceRole = query.sourceRole as Role | undefined;

  return <ArogyaYatraDashboard initialRole="developer" developerSourceRole={sourceRole} developerPatientId={query.patientId} />;
}
