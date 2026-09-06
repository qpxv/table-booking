// The command definitions registered with Discord (guild-scoped) by
// scripts/register-discord-commands.ts. Pure data: safe to import into a
// plain node script (no "server-only", no DB, no env).
//
// Re-run `npm run discord:register` after every change here.

import { CommandOptionType } from "./interactions";

export interface SlashCommand {
  name: string;
  description: string;
  options?: unknown[];
}

const S = CommandOptionType.STRING;
const I = CommandOptionType.INTEGER;
const SUB = CommandOptionType.SUB_COMMAND;

export const ALL_COMMANDS: SlashCommand[] = [
  {
    name: "verbinden",
    description: "Verknüpfe deinen Discord-Account mit deinem Dice-Bock-Konto.",
  },
  {
    name: "trennen",
    description: "Trenne die Verknüpfung zwischen Discord und deinem Dice-Bock-Konto.",
  },
  {
    name: "buchen",
    description: "Einen Tisch reservieren.",
    options: [
      { type: S, name: "datum", description: "z.B. 05.09. oder 2026-09-05", required: true },
      { type: S, name: "uhrzeit", description: "z.B. 18:00", required: true },
      { type: S, name: "dauer", description: "z.B. 3h oder 2:30 (Standard: 3h)", required: false },
      { type: S, name: "spiel", description: "Spielsystem", required: false, autocomplete: true },
      { type: S, name: "gaeste", description: "Gäste, mit Komma getrennt", required: false },
    ],
  },
  {
    name: "tische",
    description: "Tischbelegung für einen Tag anzeigen.",
    options: [
      { type: S, name: "datum", description: "z.B. 05.09. oder 2026-09-05", required: true },
    ],
  },
  {
    name: "buchungen",
    description: "Deine kommenden Buchungen anzeigen.",
  },
  {
    name: "absagen",
    description: "Eine deiner Buchungen stornieren.",
  },
  {
    name: "spielersuche",
    description: "Spielersuche verwalten.",
    options: [
      {
        type: SUB,
        name: "open",
        description: "Eine Spielersuche eröffnen.",
        options: [
          { type: S, name: "system", description: "Spielsystem", required: true, autocomplete: true },
          { type: S, name: "matchtyp", description: "z.B. 2000 Pkt, gemütlich", required: false },
          { type: S, name: "zeit", description: "Feste Uhrzeit, z.B. 05.09. 18:00 (leer = flexibel)", required: false },
          { type: I, name: "spieler", description: "Spieleranzahl inkl. dir (Standard: 2)", required: false, min_value: 2, max_value: 8 },
        ],
      },
      { type: SUB, name: "close", description: "Eine deiner Spielersuchen schließen." },
      { type: SUB, name: "accept", description: "Eine Anfrage auf deine Spielersuche annehmen." },
      { type: SUB, name: "decline", description: "Eine Anfrage auf deine Spielersuche ablehnen." },
    ],
  },
  {
    name: "event",
    description: "Vereins-Events verwalten.",
    options: [
      {
        type: SUB,
        name: "create",
        description: "Ein Event erstellen (nur Admins).",
        options: [
          { type: S, name: "titel", description: "Titel", required: true },
          { type: S, name: "start", description: "z.B. 05.09. 18:00", required: true },
          { type: S, name: "dauer", description: "z.B. 3h oder 2:30 (leer = kein Ende)", required: false },
          { type: S, name: "ort", description: "Ort", required: false },
          { type: S, name: "beschreibung", description: "Beschreibung", required: false },
        ],
      },
      { type: SUB, name: "delete", description: "Ein Event löschen (nur Admins)." },
      { type: SUB, name: "join", description: "Bei einem Event anmelden." },
      { type: SUB, name: "leave", description: "Von einem Event abmelden." },
    ],
  },
  {
    name: "getraenk",
    description: "Deinen Getränkezähler anpassen.",
    options: [
      { type: SUB, name: "add", description: "Ein Getränk hinzufügen." },
      { type: SUB, name: "remove", description: "Ein Getränk abziehen." },
    ],
  },
];
