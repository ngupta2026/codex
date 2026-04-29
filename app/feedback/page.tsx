import { ArogyaYatraDashboard } from "@/components/ArogyaYatraDashboard";
import { getOptionalServerSession } from "@/lib/auth/server";
import type { Role } from "@/lib/arogyayatra-data";

type Props = {
  searchParams?: Promise<{ sourceRole?: string; patientId?: string; requestAccess?: string; provider?: string }>;
};

export default async function FeedbackPage({ searchParams }: Props) {
  const query = (searchParams ? await searchParams : undefined) ?? {};
  const sourceRole = query.sourceRole as Role | undefined;
  const session = await getOptionalServerSession();
  const requestAccess = query.requestAccess === "1";
  const provider = query.provider?.trim() || undefined;

  return (
    <ArogyaYatraDashboard
      initialRole="feedback"
      initialSession={session}
      developerSourceRole={sourceRole}
      developerPatientId={query.patientId}
      feedbackRequestAccess={requestAccess}
      feedbackProvider={provider}
    />
  );
}
