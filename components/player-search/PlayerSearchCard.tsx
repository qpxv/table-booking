import type { JSX } from "react";
import { Swords, Handshake, Check, Trash2, TriangleAlert, CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MESSAGES } from "@/lib/constants";
import { formatBerlin } from "@/lib/datetime";
import type { OpenPlayerSearch } from "@/lib/queries/player-search";

export default function PlayerSearchCard({
  search,
  isOwn,
  canDelete,
  onRespond,
  onDelete,
  onConfirmActive,
}: {
  search: OpenPlayerSearch;
  isOwn: boolean;
  canDelete: boolean;
  onRespond: () => void;
  onDelete: () => void;
  onConfirmActive: () => void;
}): JSX.Element {
  const fixed =
    search.start !== null && search.end !== null
      ? { start: search.start, end: search.end }
      : null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Swords className="size-5" />
            </div>
            <div>
              {fixed ? (
                <>
                  <p className="font-heading text-base font-medium leading-snug">
                    {formatBerlin(fixed.start, "dd.MM.yyyy")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatBerlin(fixed.start, "HH:mm")} – {formatBerlin(fixed.end, "HH:mm")} Uhr
                  </p>
                </>
              ) : (
                <p className="flex items-center gap-1.5 font-heading text-base font-medium leading-snug">
                  <CalendarClock className="size-4 text-muted-foreground" />
                  Zeit nach Absprache
                </p>
              )}
            </div>
          </div>
          <span className="shrink-0 text-sm text-muted-foreground">von {search.creatorName}</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div>
            <Badge variant="secondary">{search.system}</Badge>
          </div>
          <p className="text-sm text-muted-foreground break-words">{search.matchType}</p>
        </div>

        {fixed && !search.tableAvailable && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <TriangleAlert className="size-4 shrink-0" />
            {MESSAGES.PLAYER_SEARCH.TABLE_UNAVAILABLE}
          </p>
        )}

        {search.needsActiveConfirmation && (
          <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3">
            <p className="text-sm">Ist diese Spielersuche noch aktuell?</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={onConfirmActive}>
                <Check />
                Ja, aktiv lassen
              </Button>
              <Button variant="outline" size="sm" onClick={onDelete}>
                <Trash2 />
                Löschen
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          {isOwn && search.interestCount > 0 ? (
            <span className="text-sm text-muted-foreground">
              {search.interestCount === 1 ? "1 Anfrage" : `${search.interestCount} Anfragen`}
            </span>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            {!isOwn &&
              (search.respondedByMe ? (
                <Button variant="outline" size="sm" disabled>
                  <Check />
                  Interesse gesendet
                </Button>
              ) : (
                <Button size="sm" onClick={onRespond}>
                  <Handshake />
                  Interesse
                </Button>
              ))}
            {canDelete && (
              <Button variant="outline" size="sm" onClick={onDelete}>
                <Trash2 />
                Löschen
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
