// Auto-detected by @ducanh2912/next-pwa as the offline fallback (convention: app/~offline/page.tsx).
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-xl font-semibold tracking-tight">Keine Internetverbindung</h1>
      <p className="text-sm text-muted-foreground">
        Diese Seite ist offline nicht verfügbar. Bitte prüfe deine Internetverbindung und
        versuche es erneut.
      </p>
    </div>
  );
}
