"use client";

import { useTransition, type JSX } from "react";
import { ArrowUpDown, KeyRound, MoreHorizontal, Pencil, ShieldCheck, Sparkles, Trash2, User, X } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
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
import { updateUserRole } from "@/service/user-service/user";
import { showToast } from "@/lib/toast";
import { ROLES } from "@/lib/constants";
import type { MemberGuestSummary } from "@/lib/guest-types";
import type { AppUser } from "@/lib/user-types";

function RoleCell({ user }: { user: AppUser }): JSX.Element {
  const [pending, startTransition] = useTransition();
  const role = user.role === ROLES.ADMIN ? ROLES.ADMIN : ROLES.USER;

  function handleChange(nextRole: string | null): void {
    if (!nextRole || nextRole === role) return;
    startTransition(async () => {
      const result = await updateUserRole(user.id, nextRole);
      showToast(result);
    });
  }

  return (
    <Select value={role} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger size="sm" className="w-32">
        <SelectValue>
          {(value: "admin" | "user") => (
            <span className="flex items-center gap-1.5">
              {pending ? <Spinner /> : value === ROLES.ADMIN ? <ShieldCheck /> : <User />}
              {value === ROLES.ADMIN ? "Vorstand" : "Mitglied"}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ROLES.USER}>
          <User />
          Mitglied
        </SelectItem>
        <SelectItem value={ROLES.ADMIN}>
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
  onRemoveGuest,
}: {
  onEdit: (user: AppUser) => void;
  onResetPassword: (user: AppUser) => void;
  onDelete: (user: AppUser) => void;
  onRemoveGuest: (guest: MemberGuestSummary) => void;
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
              <Badge key={guest.id} variant={guest.isFirstTimer ? "outline" : "secondary"} className="gap-1">
                {guest.name}
                {guest.isFirstTimer && (
                  <>
                    <Sparkles className="size-3" />
                    neu
                  </>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="ml-0.5 rounded-full [&_svg]:size-3"
                  onClick={() => onRemoveGuest(guest)}
                >
                  <X />
                  <span className="sr-only">{guest.name} entfernen</span>
                </Button>
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
