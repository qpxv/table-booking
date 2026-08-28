// The narrow contract between "something happened" (services) and "deliver a
// notification" (lib/push/web-push). Services build this from domain data and
// the MESSAGES.NOTIFICATIONS copy builders; the delivery layer stays
// copy-agnostic.
export interface PushPayload {
  title: string;
  body: string;
  // Where the SW navigates on click (app-relative, e.g. "/events").
  url: string;
  // Collapses same-topic notifications on the device instead of stacking.
  tag?: string;
}

// Shape the MESSAGES.NOTIFICATIONS builders return (title + body only; the
// call site adds url/tag).
export interface NotificationCopy {
  title: string;
  body: string;
}
