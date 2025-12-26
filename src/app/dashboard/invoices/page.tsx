import { FacturasDashboard } from "@/components/dashboard/facturas-dashboard";
import { getDispatches } from "@/lib/data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Facturas",
  description: "Administra, legaliza y visualiza tus despachos.",
};

export default async function FacturasPage() {
  const facturas = await getDispatches();
  return <FacturasDashboard initialInvoices={facturas} />;
}
