"use client";
import { useState, useMemo, useEffect } from "react";
import type { User } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  FilePenLine,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { EditUsuarioDialog } from "./edit-usuario-dialog";
import { Input } from "../ui/input";
import { Search } from "lucide-react";
import { DataTablePagination } from "./data-table-pagination";
import { useToast } from "@/hooks/use-toast";

type UsuariosDashboardProps = {
  initialUsers: User[];
};

export function UsuariosDashboard({ initialUsers }: UsuariosDashboardProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPageIndex(0);
  }, [searchTerm]);

  const handleCreate = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleToggleStatus = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    const newStatus = user.status === "Activo" ? "Inactivo" : "Activo";
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...user, status: newStatus }),
      });
      if (!res.ok) throw new Error();
      const updatedUser = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      );
      toast({
        title: "Estado actualizado",
        description: `El usuario ${
          user.name
        } ahora está ${newStatus.toLowerCase()}.`,
        className: "bg-green-100 text-green-800 border-green-300",
      });
    } catch {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del usuario.",
        variant: "destructive",
        className: "bg-red-100 text-red-800 border-red-300",
      });
    }
  };

  const handleSave = async (savedUser: User) => {
    try {
      if (editingUser) {
        const res = await fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...editingUser, ...savedUser }),
        });

        if (!res.ok) throw new Error();

        const updatedUser = await res.json();
        setUsers((prev) =>
          prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
        );

        toast({
          title: "Usuario actualizado",
          description: `Datos de ${updatedUser.name} guardados correctamente.`,
          className: "bg-green-100 text-green-800 border-green-300",
        });
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(savedUser),
        });

        if (!res.ok) throw new Error();

        const createdUser = await res.json();
        setUsers((prev) => [createdUser, ...prev]);

        toast({
          title: "Usuario creado",
          description: `Usuario ${createdUser.name} creado exitosamente.`,
          className: "bg-green-100 text-green-800 border-green-300",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "No se pudo guardar el usuario.",
        variant: "destructive",
        className: "bg-red-100 text-red-800 border-red-300",
      });
    } finally {
      setIsDialogOpen(false);
      setEditingUser(null);
      setTimeout(() => {
        window.location.reload();
      }, 300);
    }
  };

  const filteredUsers = useMemo(() => {
    const search = searchTerm.toLowerCase();

    return users.filter((user) => {
      return (
        user.name?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.role?.toLowerCase().includes(search)
      );
    });
  }, [users, searchTerm]);

  const paginatedUsers = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, pageIndex, pageSize]);

  const pageCount = Math.ceil(filteredUsers.length / pageSize);

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de búsqueda y botón */}
      <div className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-100">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </span>
          <Input
            placeholder="Buscar por nombre, correo o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-full border-gray-200 focus:border-primary/50 focus:ring-0 h-9 text-base bg-gray-50"
          />
        </div>
        <Button onClick={handleCreate} className="h-9">
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Usuario
        </Button>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {user.email}
                  </div>
                </TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      user.status === "Activo"
                        ? "bg-green-100 text-green-700 border-green-200 px-3 py-1 rounded-md font-semibold"
                        : "bg-red-100 text-red-700 border-red-200 px-3 py-1 rounded-md font-semibold"
                    }
                    variant="outline"
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString("es-CO")}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(user)}>
                        <FilePenLine className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(user.id)}
                      >
                        {user.status === "Activo" ? (
                          <>
                            <ToggleLeft className="mr-2 h-4 w-4 text-red-500" />
                            Inactivar
                          </>
                        ) : (
                          <>
                            <ToggleRight className="mr-2 h-4 w-4 text-green-500" />
                            Activar
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="bg-white rounded-xl shadow border border-gray-100 px-4 py-2 flex items-center justify-between">
        <DataTablePagination
          count={filteredUsers.length}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setPageIndex={setPageIndex}
          setPageSize={setPageSize}
          pageCount={pageCount}
          rowsInPage={paginatedUsers.length}
        />
      </div>

      {/* Diálogo de edición/creación */}
      {isDialogOpen && (
        <EditUsuarioDialog
          isOpen={isDialogOpen}
          user={editingUser}
          onSave={handleSave}
          onClose={() => {
            setIsDialogOpen(false);
            setEditingUser(null);
            setTimeout(() => {
              window.location.reload();
            }, 300);
          }}
        />
      )}
    </div>
  );
}
