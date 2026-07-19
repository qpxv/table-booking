// ISO 13616 IBAN validation: shape check, then the real MOD-97 checksum
// (not just a regex) — this feeds real SEPA transfers, so a typo shouldn't
// silently save.
export function isValidIban(raw: string): boolean {
  const iban = raw.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(iban)) return false;

  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (letter) => (letter.charCodeAt(0) - 55).toString());

  return BigInt(numeric) % BigInt(97) === BigInt(1);
}
