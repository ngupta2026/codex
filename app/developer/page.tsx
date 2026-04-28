import { ArogyaYatraDashboard } from "@/components/ArogyaYatraDashboard";
import { requireRoleSession } from "@/lib/auth/server";

export default async function DeveloperPage() {
  const session = await requireRoleSession("developer");

  return <ArogyaYatraDashboard initialRole="developer" initialSession={session} />;
}
