"use client";

import { useTransition } from "react";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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
              {pending && <Spinner />}
              {value === "admin" ? "Vorstand" : "Mitglied"}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="user">Mitglied</SelectItem>
        <SelectItem value="admin">Vorstand</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function createUserColumns({
  pending,
  onEdit,
  onDelete,
}: {
  pending: boolean;
  onEdit: (user: AppUser) => void;
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
      id: "actions",
      header: () => <div className="text-right">Aktionen</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" disabled={pending} />}>
              {pending ? <Spinner /> : <MoreHorizontal />}
              <span className="sr-only">Aktionen</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(row.original)}>Bearbeiten</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(row.original)}>
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
}
