import Link from "next/link";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import { listTables } from "@/actions/tables";

export default async function TablesListPage() {
  const allTables = await listTables();
  const activeTables = allTables.filter((table) => table.active);

  return (
    <Box className="flex flex-col gap-4">
      <Typography variant="h5" component="h1">
        Tische
      </Typography>

      {activeTables.length === 0 && (
        <Typography color="text.secondary">
          Aktuell sind keine Tische verfügbar.
        </Typography>
      )}

      <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {activeTables.map((table) => (
          <Card key={table.id} variant="outlined">
            <Link href={`/tische/${table.id}`} className="block">
              <CardActionArea component="div">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    {table.name}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Link>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
