import { ArogyaYatraDashboard } from "@/components/ArogyaYatraDashboard";

type Props = {
  params: Promise<{ patientId: string }>;
};

export default async function PatientPage({ params }: Props) {
  const { patientId } = await params;

  return <ArogyaYatraDashboard initialRole="patient" patientId={patientId} />;
}
