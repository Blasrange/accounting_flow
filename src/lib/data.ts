import type { User } from "./types";
import { FileText, LineChart, BarChart3, Users } from "lucide-react";

export const navItems = [
  { href: "/dashboard/dispatches", icon: LineChart, label: "Despachos" },
  { href: "/dashboard/invoices", icon: FileText, label: "Facturas" },
  { href: "/dashboard/reports", icon: BarChart3, label: "Reportes" },
  { href: "/dashboard/users", icon: Users, label: "Usuarios" },
];

// Obtiene usuarios reales desde la API (Server Component: usar URL absoluta)
export async function getUsers(): Promise<User[]> {
  const res = await fetch("http://localhost:9002/api/users", {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return (await res.json()) as User[];
}

// Obtiene despachos reales desde la API (Server Component: usar URL absoluta)
export async function getDispatches(): Promise<Despacho[]> {
  const res = await fetch("http://localhost:9002/api/dispatches", {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return (await res.json()) as Despacho[];
}
