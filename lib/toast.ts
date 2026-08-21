import { toast } from "sonner";
import type { ServiceResult } from "@/lib/service-types";

export function showToast(result: ServiceResult): void {
  if (result.success) {
    toast.success(result.message);
  } else {
    toast.error(result.message);
  }
}
