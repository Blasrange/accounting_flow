"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef } from "react";
import {
  Loader2,
  Package,
  Eye,
  EyeOff,
  CheckCircle,
  LogIn,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const email = emailRef.current?.value || "";
    const password = passwordRef.current?.value || "";
    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error de autenticación");
      }
      const user = await res.json();
      toast({
        title: "Inicio de Sesión Exitoso",
        description: (
          <span className="flex items-center gap-2">
            <CheckCircle className="text-green-500 w-5 h-5" />
            ¡Bienvenido de nuevo, {user.name}!
          </span>
        ),
        className: "bg-green-100 text-green-800 border-green-300",
      });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error de autenticación",
        description: error.message || "Usuario o contraseña incorrectos.",
        className: "bg-red-100 text-red-800 border-red-300",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-sm gap-6">
      <div className="grid gap-2 text-center">
        <div className="flex items-center justify-center gap-2 text-3xl font-bold text-primary mb-2 lg:hidden">
          <Package className="h-9 w-9" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Bienvenido</h1>
        <p>Ingresa tus credenciales para acceder al sistema.</p>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@devolucionespro.com"
            required
            ref={emailRef}
          />
        </div>
        <div className="grid gap-2 relative">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            placeholder="password"
            ref={passwordRef}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-muted-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        <Button
          type="submit"
          className="w-full mt-2 flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="mr-2 h-4 w-4" />
          )}
          Iniciar Sesión
        </Button>
      </form>
    </div>
  );
}
