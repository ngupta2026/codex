import { ArogyaYatraDashboard } from "@/components/ArogyaYatraDashboard";
import { requireRoleSession } from "@/lib/auth/server";
import { resolvePatientIdForSession } from "@/lib/auth/repository";

export default async function NursePage() {
  const session = await requireRoleSession("nurse");
  const patientId = resolvePatientIdForSession(session) ?? "PT-1001";

  return <ArogyaYatraDashboard initialRole="nurse" initialSession={session} patientId={patientId} nursePatientIds={session.entityIds} />;
}
