import { ArogyaYatraDashboard } from "@/components/ArogyaYatraDashboard";
import { getOptionalServerSession } from "@/lib/auth/server";

export default async function HomePage() {
  const session = await getOptionalServerSession();
  return <ArogyaYatraDashboard initialRole="home" initialSession={session} />;
}
