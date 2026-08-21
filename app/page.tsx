import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

export default function Home(): never {
  redirect(ROUTES.DASHBOARD);
}
