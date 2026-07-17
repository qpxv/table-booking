import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Box className="flex min-h-screen flex-col items-center justify-center gap-6 p-6"> 
      <Typography variant="h4" component="h1">
        Anmelden
      </Typography>
      <LoginForm />
    </Box>
  );
}
