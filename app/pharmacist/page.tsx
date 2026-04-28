import { ArogyaYatraDashboard } from "@/components/ArogyaYatraDashboard";
import { requireRoleSession } from "@/lib/auth/server";
import { resolvePatientIdForSession } from "@/lib/auth/repository";

export default async function PharmacistPage() {
  const session = await requireRoleSession("pharmacist");
  const patientId = resolvePatientIdForSession(session) ?? "PT-1001";

  return <ArogyaYatraDashboard initialRole="pharmacist" initialSession={session} patientId={patientId} pharmacistPatientIds={session.entityIds} />;
}
