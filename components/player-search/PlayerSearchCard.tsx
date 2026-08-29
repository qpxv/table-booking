import type { JSX } from "react";
import { Swords, Handshake, Check, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBerlin } from "@/lib/datetime";
import type { OpenPlayerSearch } from "@/lib/queries/player-search";

export default function PlayerSearchCard({
  search,
  isOwn,
  onRespond,
  onDelete,
}: {
  search: OpenPlayerSearch;
  isOwn: boolean;
  onRespond: () => void;
  onDelete: () => void;
}): JSX.Element {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Swords className="size-5" />
            </div>
            <div>
              <p className="font-heading text-base font-medium leading-snug">
                {formatBerlin(search.start, "dd.MM.yyyy")}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatBerlin(search.start, "HH:mm")} – {formatBerlin(search.end, "HH:mm")} Uhr
              </p>
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

        <div className="flex items-center justify-between gap-3">
          {isOwn && search.interestCount > 0 ? (
            <span className="text-sm text-muted-foreground">
              {search.interestCount === 1
                ? "1 Anfrage"
                : `${search.interestCount} Anfragen`}
            </span>
          ) : (
            <span />
          )}
          {isOwn ? (
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 />
              Löschen
            </Button>
          ) : search.respondedByMe ? (
            <Button variant="outline" size="sm" disabled>
              <Check />
              Interesse gesendet
            </Button>
          ) : (
            <Button size="sm" onClick={onRespond}>
              <Handshake />
              Interesse
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
