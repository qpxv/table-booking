import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { listUsers } from "@/actions/users";
import UserManager from "@/components/users/UserManager";

export default async function AdminUsersPage() {
  const users = await listUsers();

  return (
    <Box className="flex flex-col gap-4">
      <Typography variant="h5" component="h1">
        Benutzerverwaltung
      </Typography>
      <UserManager users={users} />
    </Box>
  );
}
