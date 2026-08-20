export type GuestHistoryRow = {
  id: string;
  memberId: string | null;
  memberName: string;
  memberUserId: string;
  tableName: string;
  start: Date;
  guestName: string;
  price: number;
  paid: boolean;
  hasIban: boolean;
};

// Flat, not a union (see Error Handling & Logging convention): referenceText/
// amount/qrDataUrl/paymentDetailsText are always present, defaulted on
// failure, instead of one nested value field, since this is already a
// multi-field payload rather than a single collection.
export type PaymentReferenceResult = {
  success: boolean;
  referenceText: string;
  amount: number;
  qrDataUrl: string | null;
  paymentDetailsText: string;
  message?: string;
};
