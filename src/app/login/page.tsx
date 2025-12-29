import { LoginForm } from "@/components/auth/login-form";
import type { Metadata } from "next";
import Image from "next/image";
import { Package } from "lucide-react";

export const metadata: Metadata = {
  title: "Login",
  description: "Inicia sesión en tu cuenta de DevolucionesPro.",
};

export default function LoginPage() {
  const loginImage = {
    imageUrl: "/imag/login.jpg",
    imageHint: "warehouse logistics",
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-1 py-4 sm:px-2">
      <div className="relative w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 shadow-2xl rounded-xl overflow-hidden min-h-[520px]">
        {/* Lado imagen: visible solo en md+ */}
        <div className="relative hidden md:flex flex-col bg-muted p-0 text-white dark:border-r overflow-hidden">
          <Image
            src={loginImage.imageUrl}
            alt="Imagen de fondo de un almacén"
            fill
            className="absolute inset-0 h-full w-full object-cover"
            data-ai-hint={loginImage.imageHint}
            priority
          />
          {/* Overlay azul corporativo */}
          <div className="absolute inset-0 bg-blue-800/60" />
          <div className="absolute bottom-0 left-0 w-full p-8 z-20">
            <h2 className="text-white text-2xl font-bold mb-2 drop-shadow-lg">
              Corporación Colombiana de Logística
            </h2>
            <p className="text-white text-base drop-shadow-lg">
              Gestión integral de legalización de facturas y manejo de devoluciones de productos.
            </p>
          </div>
        </div>
        {/* Lado formulario: siempre visible, padding adaptativo */}
        <div className="bg-card flex flex-col items-center justify-center px-4 py-10 sm:px-8 md:px-12">
          <img
            src="/imag/company.png"
            alt="CCL Logo"
            className="mx-auto h-16 mb-4"
          />
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
          <div className="mt-8 text-center text-xs text-muted-foreground">
            © 2025 Corporación Colombiana de Logística
            <br />
            Versión: 1.0.1
          </div>
        </div>
      </div>
    </div>
  );
}
