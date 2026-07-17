import { createTheme } from "@mui/material/styles";

// Club colors — PLACEHOLDER, to be replaced with the real hex codes/logo.
export const COLORS = {
  primary: "#1a1a1a",
  secondary: "#8b1a1a",
  background: "#ffffff",
} as const;

export const theme = createTheme({
  palette: {
    primary: { main: COLORS.primary },
    secondary: { main: COLORS.secondary },
    background: { default: COLORS.background, paper: COLORS.background },
  },
  shape: {
    borderRadius: 8,
  },
});
