import { ArogyaYatraDashboard } from "@/components/ArogyaYatraDashboard";
import { listPendingAccessRequests } from "@/lib/auth/pending-access";
import { requireRoleSession } from "@/lib/auth/server";
import { resolvePatientIdForSession } from "@/lib/auth/repository";

export default async function AdminPage() {
  const session = await requireRoleSession("admin");
  const patientId = resolvePatientIdForSession(session) ?? "PT-1001";
  const pendingApprovals = await listPendingAccessRequests();

  return (
    <ArogyaYatraDashboard
      initialRole="admin"
      initialSession={session}
      patientId={patientId}
      pendingApprovals={pendingApprovals}
    />
  );
}
