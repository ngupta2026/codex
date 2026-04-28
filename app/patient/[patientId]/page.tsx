import { ArogyaYatraDashboard } from "@/components/ArogyaYatraDashboard";
import { requireRoleSession } from "@/lib/auth/server";
import { roleHomePath } from "@/lib/auth/repository";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ patientId: string }>;
};

export default async function PatientPage({ params }: Props) {
  const session = await requireRoleSession("patient");
  const { patientId } = await params;

  if (session.linkedEntityId !== patientId) {
    redirect(roleHomePath(session));
  }

  return <ArogyaYatraDashboard initialRole="patient" initialSession={session} patientId={patientId} />;
}
