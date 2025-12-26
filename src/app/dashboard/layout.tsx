"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { navItems } from "@/lib/data";
import { LogOut, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const inactivityTimeout = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutos

  const [loading, setLoading] = useState(false);

  // Loader al cambiar de ruta
  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timeout);
  }, [pathname]);

  // --- INACTIVIDAD ---
  useEffect(() => {
    const resetTimer = () => {
      if (inactivityTimeout.current) clearTimeout(inactivityTimeout.current);
      inactivityTimeout.current = setTimeout(() => {
        toast({
          title: "Sesión cerrada por inactividad",
          description: (
            <span className="flex items-center gap-2">
              <CheckCircle className="text-green-500 w-5 h-5" />
              Tu sesión ha sido cerrada automáticamente por inactividad.
            </span>
          ),
          className: "bg-green-100 text-green-800 border-green-300",
        });
        handleLogout(true);
      }, INACTIVITY_LIMIT);
    };

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();
    return () => {
      if (inactivityTimeout.current) clearTimeout(inactivityTimeout.current);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, []);

  const handleLogout = (fromInactivity = false) => {
    if (!fromInactivity) {
      toast({
        title: "Sesión cerrada",
        description: (
          <span className="flex items-center gap-2">
            <CheckCircle className="text-green-500 w-5 h-5" />
            Has cerrado sesión correctamente.
          </span>
        ),
        className: "bg-green-100 text-green-800 border-green-300",
      });
    }
    // Limpieza de sesión si aplica
    // localStorage.removeItem("token");
    router.replace("/login");
  };

  return (
    <div className="w-full relative">
      {/* ================= NAVBAR ================= */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-8 py-1 shadow-md bg-[#29486b] text-white min-h-[48px] text-sm">
        <div className="flex items-center gap-5">
          <span
            className="text-2xl font-black italic tracking-tight drop-shadow-md select-none"
            style={{ letterSpacing: "0.05em" }}
          >
            CCL
          </span>

          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-150 hover:bg-[#22385a] active:scale-95 text-sm ${
                  pathname.startsWith(item.href)
                    ? "bg-[#22385a] text-white font-bold"
                    : "text-white/80"
                }`}
              >
                {item.icon && <item.icon className="w-5 h-5 opacity-80" />}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ================= LOGOUT BUTTON ================= */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleLogout()}
          title="Cerrar sesión"
          className="w-8 h-8 rounded-full bg-white text-[#29486b] shadow-md hover:text-white transition-all duration-200 active:scale-95"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </nav>

      {/* ================= LOADER ================= */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="flex flex-col items-center justify-center p-8 bg-[#222c38] rounded-2xl shadow-2xl min-w-[260px] min-h-[220px]">
            <svg
              className="animate-spin-slow mb-6"
              width="80"
              height="80"
              viewBox="0 0 80 80"
            >
              {/* Fondo */}
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="#222c38"
                strokeWidth="8"
                fill="none"
                opacity="0.25"
              />
              {/* Azul */}
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="#2563eb"
                strokeWidth="5"
                fill="none"
                strokeDasharray="32 100"
                strokeDashoffset="0"
                strokeLinecap="round"
              />
              {/* Verde */}
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="#22d3ee"
                strokeWidth="5"
                fill="none"
                strokeDasharray="32 100"
                strokeDashoffset="40"
                strokeLinecap="round"
              />
              {/* Amarillo */}
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="#fde047"
                strokeWidth="5"
                fill="none"
                strokeDasharray="32 100"
                strokeDashoffset="80"
                strokeLinecap="round"
              />
            </svg>

            <span className="text-white text-lg font-bold">Cargando...</span>
          </div>
        </div>
      )}

      {/* ================= CSS ANIMACIÓN ================= */}
      <style>{`
        @keyframes spin-slow {
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 1.2s linear infinite;
        }
      `}</style>

      <main className="p-6 bg-[#f8fafc] min-h-[90vh]">{children}</main>
    </div>
  );
}
