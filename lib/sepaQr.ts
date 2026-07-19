// Builds an EPC QR code payload — the European Payments Council's
// standardized SEPA credit-transfer QR ("GiroCode") format. Verified against
// the EPC069-12 spec (11 ordered lines, cross-checked across the EPC's own
// guidance and multiple independent technical write-ups) rather than
// assumed. This is plain text meant to be rendered as a QR *image* and
// scanned by a banking app's camera — there is no SEPA equivalent of a
// clickable "payment link".
export type EpcPaymentInput = {
  /** Beneficiary (payee) name — truncated to the spec's 70-char max. */
  name: string;
  /** IBAN, with or without spaces. */
  iban: string;
  /** Amount in EUR, e.g. 5 or 12.5. */
  amount: number;
  /** Unstructured remittance info — truncated to the spec's 140-char max. */
  reference: string;
};

export function buildEpcPayload({ name, iban, amount, reference }: EpcPaymentInput): string {
  const cleanIban = iban.replace(/\s+/g, "").toUpperCase();

  return [
    "BCD", // Service Tag
    "002", // Version
    "1", // Character set: UTF-8
    "SCT", // Identification: SEPA Credit Transfer
    "", // BIC — optional, not required for SEPA transfers since 2016
    name.slice(0, 70), // Beneficiary name
    cleanIban, // IBAN
    `EUR${amount.toFixed(2)}`, // Amount (period decimal separator, no thousands separator)
    "", // Purpose code — left empty
    "", // Creditor Reference (structured, ISO 11649) — not used
    reference.slice(0, 140), // Payment Reference (unstructured remittance info)
  ].join("\n");
}
