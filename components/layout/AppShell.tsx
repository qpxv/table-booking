"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { authClient } from "@/lib/auth-client";

type AppShellUser = {
  name: string;
  role: string;
};

export default function AppShell({
  user,
  children,
}: {
  user: AppShellUser;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAdmin = user.role === "admin";

  async function handleLogout() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Box className="flex min-h-screen flex-col">
      <AppBar position="static" color="primary">
        <Toolbar className="gap-4">
          <Typography variant="h6" component={Link} href="/dashboard" className="!no-underline !text-inherit grow">
            Vereins-Tischbuchung
          </Typography>
          <Button color="inherit" component={Link} href="/dashboard">
            Dashboard
          </Button>
          <Button color="inherit" component={Link} href="/tische">
            Tische
          </Button>
          {isAdmin && (
            <>
              <Button color="inherit" component={Link} href="/admin/tische">
                Tischverwaltung
              </Button>
              <Button color="inherit" component={Link} href="/admin/users">
                Benutzerverwaltung
              </Button>
            </>
          )}
          <Typography variant="body2" className="opacity-80">
            {user.name}
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Abmelden
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main" className="flex flex-1 flex-col p-6">
        {children}
      </Box>
    </Box>
  );
}
