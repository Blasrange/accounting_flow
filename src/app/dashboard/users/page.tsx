import { UsuariosDashboard } from "@/components/dashboard/usuarios-dashboard";
import { getUsers } from "@/lib/data";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Usuarios",
  description: "Administra los usuarios y roles del sistema.",
};

export default async function UsuariosPage() {
  // Obtener usuario actual del localStorage (solo en cliente)
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === "Auditor") {
          alert(
            "Acceso denegado: los auditores no pueden ingresar al módulo de usuarios."
          );
          window.location.href = "/dashboard";
          return null;
        }
      } catch {}
    }
  }
  const users = await getUsers();
  return <UsuariosDashboard initialUsers={users} />;
}
