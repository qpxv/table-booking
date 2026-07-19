"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  getGuestPaymentReference,
  type GuestHistoryRow,
  type GuestPaymentReferenceResult,
} from "@/actions/guestHistory";

// Verified help pages on scanning a payment QR code (GiroCode/EPC), one per
// bank — official pages where the bank has a clear one, girocodegenerator.com
// (a GiroCode-focused site with consistent per-bank guides) as fallback
// otherwise. Logos are rasterized PNGs (public/bank-logos/*.png), not SVGs —
// several of the source SVGs (ING, DKB, N26) rendered `object-fit: contain`
// inconsistently across sizing approaches for reasons that didn't trace back
// to one common cause (checked intrinsic-size units, missing width/height,
// inline <style> blocks, DOCTYPEs — none of it lined up across all three).
// Rasterizing sidesteps the whole class of bug: a bitmap's natural size is
// unambiguous, so `object-contain` in a fixed `h-4 w-8` box behaves
// identically for all eight. Sourced from Wikimedia Commons (plus one clean
// vector-logo site for Postbank's current mark) rather than hotlinked — this
// app has no other precedent for embedding third-party assets.
const BANK_HELP_LINKS = [
  {
    name: "Sparkasse",
    logo: "/bank-logos/sparkasse.png",
    url: "https://www.sparkasse.de/pk/produkte/konten-und-karten/banking/ueberweisung/girocode.html",
  },
  {
    name: "Postbank",
    logo: "/bank-logos/postbank.png",
    url: "https://girocodegenerator.com/postbank",
  },
  {
    name: "Commerzbank",
    logo: "/bank-logos/commerzbank.png",
    url: "https://www.commerzbank.de/service/wie-taetige-ich-eine-fotoueberweisung/",
  },
  {
    name: "ING",
    logo: "/bank-logos/ing.png",
    url: "https://www.ing.de/wissen/fotoueberweisung/",
  },
  {
    name: "Deutsche Bank",
    logo: "/bank-logos/deutsche-bank.png",
    url: "https://www.girocodegenerator.com/deutsche-bank",
  },
  {
    name: "DKB",
    logo: "/bank-logos/dkb.png",
    url: "https://girocodegenerator.com/dkb",
  },
  {
    name: "N26",
    logo: "/bank-logos/n26.png",
    url: "https://www.girocodegenerator.com/n26",
  },
  {
    name: "Volksbank / VR-Banking",
    logo: "/bank-logos/volksbank.png",
    url: "https://www.girocodegenerator.com/volksbank",
  },
];

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
    navigator.clipboard.writeText(result.paymentDetailsText);
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
            {/* Shows exactly what "Bezahlungsdetails kopieren" copies —
                same string, no drift possible between preview and clipboard. */}
            <pre className="whitespace-pre-wrap rounded-lg bg-muted p-3 font-mono text-sm">
              {result.paymentDetailsText}
            </pre>
            <Button type="button" variant="outline" onClick={handleCopy}>
              <Copy />
              Bezahlungsdetails kopieren
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

            {result.qrDataUrl && (
              <Accordion>
                <AccordionItem value="scan-help">
                  <AccordionTrigger>Wie kann ich einen QR-Code scannen?</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-2">
                      {BANK_HELP_LINKS.map((bank) => (
                        <Button
                          key={bank.name}
                          variant="outline"
                          className="no-underline! justify-start py-2"
                          nativeButton={false}
                          render={
                            <a href={bank.url} target="_blank" rel="noopener noreferrer" />
                          }
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={bank.logo}
                            alt=""
                            className="h-4 w-8 shrink-0 object-contain"
                          />
                          {bank.name}
                          <ExternalLink className="ml-auto size-3.5 text-muted-foreground" />
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
