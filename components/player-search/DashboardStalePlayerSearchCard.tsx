"use client";

import { useState, useTransition, type JSX } from "react";
import { Check, Trash2 } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import ConfirmDeleteDialog from "@/components/shared/ConfirmDeleteDialog";
import { CONFIRM_MODE } from "@/lib/constants";
import { daysSince } from "@/lib/datetime";
import {
  confirmPlayerSearchActive,
  deletePlayerSearch,
} from "@/service/player-search-service/player-search";
import { showToast } from "@/lib/toast";
import type { StalePlayerSearch } from "@/lib/queries/player-search";

export default function DashboardStalePlayerSearchCard({
  search,
}: {
  search: StalePlayerSearch;
}): JSX.Element {
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const days = daysSince(search.createdAt.toISOString());

  function confirmActive(): void {
    startTransition(async () => {
      showToast(await confirmPlayerSearchActive(search.id));
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle>Ist deine Spielersuche noch aktuell?</CardTitle>
          <p className="text-sm text-muted-foreground">Seit {days} Tagen offen</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <div>
            <Badge variant="secondary">{search.system}</Badge>
          </div>
          <p className="text-sm text-muted-foreground break-words">{search.matchType}</p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)} disabled={pending}>
            <Trash2 />
            Löschen
          </Button>
          <Button size="sm" onClick={confirmActive} disabled={pending}>
            {pending ? <Spinner /> : <Check />}
            Ja, aktiv lassen
          </Button>
        </div>
      </CardContent>

      {deleteOpen && (
        <ConfirmDeleteDialog
          mode={CONFIRM_MODE.PLAYER_SEARCH}
          onConfirm={() => deletePlayerSearch(search.id)}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </Card>
  );
}
