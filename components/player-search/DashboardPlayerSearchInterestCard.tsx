"use client";

import { useTransition, type JSX } from "react";
import { Check, TriangleAlert, X } from "lucide-react";
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
import type { IncomingPlayerSearchInterest } from "@/lib/queries/player-search";

export default function DashboardPlayerSearchInterestCard({
  interest,
}: {
  interest: IncomingPlayerSearchInterest;
}): JSX.Element {
  const [pending, startTransition] = useTransition();
  const { search } = interest;

  function respond(accept: boolean): void {
    startTransition(async () => {
      const result = accept
        ? await acceptPlayerSearchInterest(interest.id)
        : await declinePlayerSearchInterest(interest.id);
      showToast(result);
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle>{interest.responderName} möchte mitspielen</CardTitle>
          <p className="text-sm text-muted-foreground">
            {formatBerlin(search.start, "dd.MM.yyyy")}, {formatBerlin(search.start, "HH:mm")} –{" "}
            {formatBerlin(search.end, "HH:mm")} Uhr
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <div>
            <Badge variant="secondary">{search.system}</Badge>
          </div>
          <p className="text-sm text-muted-foreground break-words">{search.matchType}</p>
        </div>

        {!search.tableAvailable && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <TriangleAlert className="size-4 shrink-0" />
            {MESSAGES.PLAYER_SEARCH.TABLE_UNAVAILABLE}
          </p>
        )}

        {interest.note && <p className="text-sm whitespace-pre-line">{interest.note}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => respond(false)} disabled={pending}>
            {pending ? <Spinner /> : <X />}
            Ablehnen
          </Button>
          <Button size="sm" onClick={() => respond(true)} disabled={pending}>
            {pending ? <Spinner /> : <Check />}
            Annehmen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
