"use client";

import { useState, type JSX } from "react";
import { CalendarDays, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import { CONFIRM_MODE } from "@/lib/constants";
import { deleteEvent } from "@/service/event-service/event";
import type { ClubEvent } from "@/lib/event-types";
import EventList from "./EventList";
import EventCalendar from "./EventCalendar";
import EventFormDialog from "./EventFormDialog";

type View = "list" | "calendar";

export default function EventsView({
  events,
  currentUserId,
  isAdmin,
}: {
  events: ClubEvent[];
  currentUserId: string;
  isAdmin: boolean;
}): JSX.Element {
  const [view, setView] = useState<View>("list");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ClubEvent | null>(null);
  const [createDate, setCreateDate] = useState<Date | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClubEvent | null>(null);

  function openCreate(): void {
    setEditTarget(null);
    setCreateDate(null);
    setFormOpen(true);
  }

  function openCreateOnDate(date: Date): void {
    setEditTarget(null);
    setCreateDate(date);
    setFormOpen(true);
  }

  function openEdit(event: ClubEvent): void {
    setEditTarget(event);
    setCreateDate(null);
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      {isAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-lg border p-0.5">
            <ViewButton active={view === "list"} onClick={() => setView("list")}>
              <List />
              Liste
            </ViewButton>
            <ViewButton active={view === "calendar"} onClick={() => setView("calendar")}>
              <CalendarDays />
              Kalender
            </ViewButton>
          </div>
          <Button onClick={openCreate}>
            <Plus />
            Neues Event
          </Button>
        </div>
      )}

      {isAdmin && view === "calendar" ? (
        <EventCalendar
          events={events}
          onSelectEvent={openEdit}
          onCreateOnDate={openCreateOnDate}
        />
      ) : (
        <EventList
          events={events}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />
      )}

      {formOpen && (
        <EventFormDialog
          event={editTarget}
          initialDate={createDate ?? undefined}
          onClose={() => setFormOpen(false)}
        />
      )}
      {deleteTarget && (
        <ConfirmDeleteDialog
          mode={CONFIRM_MODE.EVENT}
          onConfirm={() => deleteEvent(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors [&_svg]:size-4",
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
