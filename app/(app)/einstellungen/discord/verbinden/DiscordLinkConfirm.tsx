"use client";

import { useState, useTransition, type JSX } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ROUTES, MESSAGES } from "@/lib/constants";
import { linkDiscordAccount } from "@/service/user-service/discord-link";

type State =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export default function DiscordLinkConfirm({
  token,
}: {
  token: string | null;
}): JSX.Element {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<State>({ status: "idle" });

  if (!token) {
    return <Feedback status="error" message={MESSAGES.DISCORD.LINK_EXPIRED} />;
  }

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-start gap-4">
        <Feedback status="success" message={state.message} />
        <Button render={<a href={ROUTES.DASHBOARD}>Zum Dashboard</a>} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-4">
      {state.status === "error" && (
        <Feedback status="error" message={state.message} />
      )}
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await linkDiscordAccount(token);
            if (result.success) {
              setState({ status: "success", message: result.message });
              router.refresh();
              return;
            }
            setState({ status: "error", message: result.message });
          })
        }
      >
        {pending && <Spinner />}
        Verbinden bestätigen
      </Button>
    </div>
  );
}

function Feedback({
  status,
  message,
}: {
  status: "success" | "error";
  message: string;
}): JSX.Element {
  const Icon = status === "success" ? CheckCircle2 : XCircle;
  return (
    <p
      className={
        status === "success"
          ? "flex items-center gap-2 text-sm text-foreground"
          : "flex items-center gap-2 text-sm text-destructive"
      }
    >
      <Icon className="size-4 shrink-0" />
      <span>{message}</span>
    </p>
  );
}
