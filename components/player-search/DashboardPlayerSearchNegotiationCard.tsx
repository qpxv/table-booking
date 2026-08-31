"use client";

import { useState, useTransition, type JSX } from "react";
import { CalendarClock, Check, TriangleAlert, X } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { MESSAGES } from "@/lib/constants";
import { formatBerlin } from "@/lib/datetime";
import {
  acceptPlayerSearchInterest,
  declinePlayerSearchInterest,
} from "@/service/player-search-service/player-search";
import { showToast } from "@/lib/toast";
import type { PlayerSearchNegotiation } from "@/lib/queries/player-search";
import PlayerSearchCounterDialog from "./PlayerSearchCounterDialog";

export default function DashboardPlayerSearchNegotiationCard({
  negotiation,
}: {
  negotiation: PlayerSearchNegotiation;
}): JSX.Element {
  const [pending, startTransition] = useTransition();
  const [counterOpen, setCounterOpen] = useState(false);

  const title =
    negotiation.role === "creator"
      ? `${negotiation.counterpartName} möchte mitspielen`
      : `Deine Anfrage an ${negotiation.counterpartName}`;

  function respond(accept: boolean): void {
    startTransition(async () => {
      showToast(
        accept
          ? await acceptPlayerSearchInterest(negotiation.id)
          : await declinePlayerSearchInterest(negotiation.id),
      );
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle>{title}</CardTitle>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarClock className="size-4 shrink-0" />
            {formatBerlin(negotiation.proposedStart, "dd.MM.yyyy")},{" "}
            {formatBerlin(negotiation.proposedStart, "HH:mm")} –{" "}
            {formatBerlin(negotiation.proposedEnd, "HH:mm")} Uhr
          </p>
          <p className="text-xs text-muted-foreground">
            {negotiation.proposedByMe
              ? "Dein Vorschlag"
              : `Vorschlag von ${negotiation.proposerName}`}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <div>
            <Badge variant="secondary">{negotiation.system}</Badge>
          </div>
          <p className="text-sm text-muted-foreground break-words">{negotiation.matchType}</p>
        </div>

        {negotiation.tableAvailable === false && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <TriangleAlert className="size-4 shrink-0" />
            {MESSAGES.PLAYER_SEARCH.TABLE_UNAVAILABLE}
          </p>
        )}

        {negotiation.note && (
          <p className="text-sm whitespace-pre-line">{negotiation.note}</p>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2">
          {negotiation.awaitingMe ? (
            <>
              <Button variant="outline" size="sm" onClick={() => respond(false)} disabled={pending}>
                {pending ? <Spinner /> : <X />}
                Ablehnen
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCounterOpen(true)}
                disabled={pending}
              >
                <CalendarClock />
                Gegenvorschlag
              </Button>
              <Button size="sm" onClick={() => respond(true)} disabled={pending}>
                {pending ? <Spinner /> : <Check />}
                Annehmen
              </Button>
            </>
          ) : (
            <>
              <span className="mr-auto text-sm text-muted-foreground">
                Warten auf {negotiation.counterpartName}
              </span>
              {negotiation.role === "creator" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => respond(false)}
                  disabled={pending}
                >
                  {pending ? <Spinner /> : <X />}
                  Ablehnen
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>

      {counterOpen && (
        <PlayerSearchCounterDialog
          interestId={negotiation.id}
          initialStart={negotiation.proposedStart}
          initialEnd={negotiation.proposedEnd}
          onClose={() => setCounterOpen(false)}
        />
      )}
    </Card>
  );
}
