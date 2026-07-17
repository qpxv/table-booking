import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { listTables } from "@/actions/tables";
import TableManager from "@/components/tables/TableManager";

export default async function AdminTablesPage() {
  const tables = await listTables();

  return (
    <Box className="flex flex-col gap-4">
      <Typography variant="h5" component="h1">
        Tischverwaltung
      </Typography>
      <TableManager tables={tables} />
    </Box>
  );
}
