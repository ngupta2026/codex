import { ArogyaYatraDashboard } from "@/components/ArogyaYatraDashboard";
import { getOptionalServerSession } from "@/lib/auth/server";
import type { Role } from "@/lib/arogyayatra-data";

type Props = {
  searchParams?: Promise<{ sourceRole?: string; patientId?: string }>;
};

export default async function FeedbackPage({ searchParams }: Props) {
  const query = (searchParams ? await searchParams : undefined) ?? {};
  const sourceRole = query.sourceRole as Role | undefined;
  const session = await getOptionalServerSession();

  return <ArogyaYatraDashboard initialRole="feedback" initialSession={session} developerSourceRole={sourceRole} developerPatientId={query.patientId} />;
}
