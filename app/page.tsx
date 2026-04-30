import { ArogyaYatraDashboard } from "@/components/ArogyaYatraDashboard";
import { getOptionalPendingAccessSession, getOptionalServerSession } from "@/lib/auth/server";

export default async function HomePage() {
  const session = await getOptionalServerSession();
  const pendingAccess = session ? null : await getOptionalPendingAccessSession();
  return <ArogyaYatraDashboard initialRole="home" initialSession={session} pendingAccess={pendingAccess} />;
}
