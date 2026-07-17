import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

// Auto-detected by @ducanh2912/next-pwa as the offline fallback (convention: app/~offline/page.tsx).
export default function OfflinePage() {
  return (
    <Box
      className="flex min-h-screen flex-col items-center justify-center gap-2 p-8 text-center"
    >
      <Typography variant="h5" component="h1">
        Keine Internetverbindung
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Diese Seite ist offline nicht verfügbar. Bitte prüfe deine
        Internetverbindung und versuche es erneut.
      </Typography>
    </Box>
  );
}
