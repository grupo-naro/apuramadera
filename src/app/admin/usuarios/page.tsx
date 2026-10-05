import type { Metadata } from "next";

import { auth } from "@/core/auth";
import { listAdminUsers } from "@/core/modules/users";
import { Badge } from "@/core/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/table";
import { DeleteUserButton } from "@/features/admin/delete-user-button";
import { UserForm } from "@/features/admin/user-form";

export const metadata: Metadata = {
  title: "Usuarios",
  robots: { index: false },
};

export default async function AdminUsersPage() {
  const [session, users] = await Promise.all([auth(), listAdminUsers()]);
  const currentUserId = session?.user?.id;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Personas con acceso al panel. Todas tienen acceso completo.
        </p>
      </div>

      <UserForm />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>DNI</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name ?? "—"}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.dni ?? "—"}</TableCell>
              <TableCell>
                {user.isPrincipal ? (
                  <Badge>Admin principal</Badge>
                ) : user.mustChangePassword ? (
                  <Badge variant="secondary">Debe cambiar la clave</Badge>
                ) : (
                  <Badge variant="outline">Activo</Badge>
                )}
              </TableCell>
              <TableCell>
                {!user.isPrincipal && user.id !== currentUserId && (
                  <DeleteUserButton userId={user.id} userEmail={user.email} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
