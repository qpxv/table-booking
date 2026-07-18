"use client";

import { useTransition } from "react";
import { ArrowUpDown, KeyRound, MoreHorizontal, Pencil, ShieldCheck, Trash2, User } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateUserRole } from "@/actions/users";
import type { AppUser } from "./UserFormDialog";

function RoleCell({ user }: { user: AppUser }) {
  const [pending, startTransition] = useTransition();
  const role = user.role === "admin" ? "admin" : "user";

  function handleChange(nextRole: string | null) {
    if (!nextRole || nextRole === role) return;
    startTransition(async () => {
      const result = await updateUserRole(user.id, nextRole);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <Select value={role} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger size="sm" className="w-32">
        <SelectValue>
          {(value: "admin" | "user") => (
            <span className="flex items-center gap-1.5">
              {pending ? <Spinner /> : value === "admin" ? <ShieldCheck /> : <User />}
              {value === "admin" ? "Vorstand" : "Mitglied"}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="user">
          <User />
          Mitglied
        </SelectItem>
        <SelectItem value="admin">
          <ShieldCheck />
          Vorstand
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

export function createUserColumns({
  onEdit,
  onResetPassword,
  onDelete,
}: {
  onEdit: (user: AppUser) => void;
  onResetPassword: (user: AppUser) => void;
  onDelete: (user: AppUser) => void;
}): ColumnDef<AppUser>[] {
  return [
    {
      accessorKey: "memberId",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-2.5"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Mitglieds-Nr.
          <ArrowUpDown className="ml-1.5" />
        </Button>
      ),
      cell: ({ row }) => row.original.memberId ?? "–",
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "E-Mail",
    },
    {
      accessorKey: "role",
      header: "Rolle",
      cell: ({ row }) => <RoleCell user={row.original} />,
    },
    {
      id: "guests",
      header: "Gäste",
      cell: ({ row }) => {
        const guests = row.original.guests ?? [];
        if (guests.length === 0) {
          return <span className="text-sm text-muted-foreground">Keine Gäste</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {guests.map((guest) => (
              <Badge key={guest.id} variant={guest.isFirstTimer ? "outline" : "secondary"}>
                {guest.name}
                {guest.isFirstTimer && " · neu"}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aktionen</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <MoreHorizontal />
              <span className="sr-only">Aktionen</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <Pencil />
                Bearbeiten
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onResetPassword(row.original)}>
                <KeyRound />
                Passwort zurücksetzen
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(row.original)}>
                <Trash2 />
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
}
