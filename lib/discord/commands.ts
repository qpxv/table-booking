// The command definitions registered with Discord (guild-scoped) by
// scripts/register-discord-commands.ts. Pure data: safe to import into a
// plain node script (no "server-only", no DB, no env).
//
// This list grows one rollout phase at a time. Re-run
// `npm run discord:register` after every change here.

export interface SlashCommand {
  name: string;
  description: string;
  // Kept loose on purpose: option schemas arrive in later phases.
  options?: unknown[];
}

export const ALL_COMMANDS: SlashCommand[] = [
  {
    name: "verbinden",
    description:
      "Verknüpfe deinen Discord-Account mit deinem Dice-Bock-Konto.",
  },
  {
    name: "trennen",
    description:
      "Trenne die Verknüpfung zwischen Discord und deinem Dice-Bock-Konto.",
  },
];
