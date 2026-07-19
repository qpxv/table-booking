"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  getGuestPaymentReference,
  type GuestHistoryRow,
  type GuestPaymentReferenceResult,
} from "@/actions/guestHistory";

// Fetches the Verwendungszweck text + SEPA QR image (if the bringing member
// has an IBAN) lazily, only once this dialog actually opens — never
// generated up front for every row in the table.
export default function PaymentDialog({
  row,
  onClose,
}: {
  row: GuestHistoryRow;
  onClose: () => void;
}) {
  const [result, setResult] = useState<GuestPaymentReferenceResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    getGuestPaymentReference(row.id).then((res) => {
      if (!cancelled) setResult(res);
    });
    return () => {
      cancelled = true;
    };
  }, [row.id]);

  function handleCopy() {
    if (!result?.success) return;
    navigator.clipboard.writeText(result.referenceText);
    toast.success("In Zwischenablage kopiert.");
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Zahlung — {row.guestName}</DialogTitle>
        </DialogHeader>

        {!result && (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        )}

        {result && !result.success && <p className="text-sm text-destructive">{result.message}</p>}

        {result && result.success && (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">{result.amount.toFixed(2)} €</p>
              <p className="text-muted-foreground">{result.referenceText}</p>
            </div>
            <Button type="button" variant="outline" onClick={handleCopy}>
              <Copy />
              Verwendungszweck kopieren
            </Button>
            {result.qrDataUrl ? (
              <div className="flex flex-col items-center gap-2">
                {/* Dynamically generated data URL, not a static asset —
                    next/image isn't the right tool here. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.qrDataUrl} alt="SEPA-Zahlungs-QR-Code" className="size-48" />
                <p className="text-center text-xs text-muted-foreground">
                  Mit der Banking-App scannen, um die Überweisung vorzubereiten.
                </p>
              </div>
            ) : (
              <p className="text-center text-xs text-muted-foreground">
                Kein SEPA-QR-Code verfügbar — dieses Mitglied hat noch keine IBAN in den
                Zahlungsdetails hinterlegt.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            <X />
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
