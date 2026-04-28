import { ArogyaYatraDashboard } from "@/components/ArogyaYatraDashboard";
import { requireRoleSession } from "@/lib/auth/server";
import { resolvePatientIdForSession } from "@/lib/auth/repository";

export default async function AdminPage() {
  const session = await requireRoleSession("admin");
  const patientId = resolvePatientIdForSession(session) ?? "PT-1001";

  return <ArogyaYatraDashboard initialRole="admin" initialSession={session} patientId={patientId} />;
}
