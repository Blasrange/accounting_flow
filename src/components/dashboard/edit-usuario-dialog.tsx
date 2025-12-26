"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { User2, Mail, Lock, UserPlus, UserCog, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import type { User } from "@/lib/types";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const schema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().optional(),
  role: z.enum(["Administrador", "Auditor"]),
});

type FormData = z.infer<typeof schema>;

export function EditUsuarioDialog({
  isOpen,
  user,
  onSave,
  onClose,
}: {
  isOpen: boolean;
  user: User | null;
  onSave: (user: User) => void;
  onClose: () => void;
}) {
  const isEdit = !!user;
  const router = useRouter();

  const { register, handleSubmit, control, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (user) reset(user);
    else
      reset({
        name: "",
        email: "",
        password: "",
        role: "Auditor",
      });
  }, [user, reset]);

  const submit = (data: FormData) => {
    onSave({ ...user, ...data } as User);
    onClose();
    setTimeout(() => {
      router.refresh();
    }, 100);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => router.refresh(), 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? (
              <>
                <UserCog className="w-5 h-5 text-blue-600" />
                Editar Usuario
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 text-blue-600" />
                Crear Usuario
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifica los datos del usuario y guarda los cambios."
              : "Completa los datos para crear un nuevo usuario."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1">Nombre</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-blue-500">
                  <User2 className="w-4 h-4" />
                </span>
                <Input
                  {...register("name")}
                  className="pl-9 h-8 text-sm rounded-md border-gray-200 focus:border-blue-400 focus:ring-0 bg-gray-50"
                  placeholder="Nombre completo"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1">Email</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-blue-500">
                  <Mail className="w-4 h-4" />
                </span>
                <Input
                  type="email"
                  {...register("email")}
                  className="pl-9 h-8 text-sm rounded-md border-gray-200 focus:border-blue-400 focus:ring-0 bg-gray-50"
                  placeholder="Correo electrónico"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1">Contraseña</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-blue-500">
                  <Lock className="w-4 h-4" />
                </span>
                <Input
                  type="password"
                  {...register("password")}
                  className="pl-9 h-8 text-sm rounded-md border-gray-200 focus:border-blue-400 focus:ring-0 bg-gray-50"
                  placeholder="Contraseña"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1">Rol</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-8 text-sm rounded-md border-gray-200 bg-gray-50 focus:border-blue-400">
                      <SelectValue placeholder="Seleccione rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Administrador">
                        Administrador
                      </SelectItem>
                      <SelectItem value="Auditor">Auditor</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={handleClose}
              className="h-8 px-3 text-sm flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </Button>
            <Button
              type="submit"
              className="h-8 px-4 text-sm bg-[#5b8fd7] hover:bg-[#4477be] text-white font-semibold rounded-md flex items-center gap-2"
            >
              {isEdit ? (
                <>
                  <UserCog className="w-4 h-4" />
                  Guardar
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Crear
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
