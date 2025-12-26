import DespachosDashboard from "@/components/dashboard/despachos-dashboard";
import { getDispatches } from "@/lib/data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Indicadores y análisis de los despachos.",
};

export default async function DespachosPage() {
  const despachos = await getDispatches();
  return <DespachosDashboard initialDespachos={despachos} />;
}
