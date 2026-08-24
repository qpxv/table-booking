export const WEBSITE_NAV_LINKS = [
  { href: "#angebot", label: "Angebot" },
  { href: "#ueber-uns", label: "Über uns" },
  { href: "#ablauf", label: "Ablauf" },
  { href: "#kontakt", label: "Kontakt" },
] as const;

export const HERO = {
  eyebrow: "Dice-Bock e.V.",
  headline: "Würfel fallen. Der Bock bleibt.",
  subheadline:
    "Ein Verein für alle, die Brett- und Würfelspiele lieben. Feste Tische, wachsende Sammlung.",
  primaryCta: { label: "Kontakt aufnehmen", href: "#kontakt" },
  secondaryCta: { label: "Unser Angebot entdecken", href: "#angebot" },
} as const;

export const ABOUT = {
  eyebrow: "Über uns",
  heading: "Ein Verein, kein Vereinsheim voller Regeln.",
  paragraphs: [
    "Der Dice-Bock e.V. ist aus einer festen Spielrunde entstanden, die irgendwann zu groß für ein Wohnzimmer wurde. Heute treffen wir uns regelmäßig, um zu würfeln, zu ziehen, zu bluffen und zu gewinnen – oder eben nicht.",
    "Uns eint der Spieltisch, nicht das Alter oder die Erfahrung. Neulinge lernen die Regeln direkt am Tisch, erfahrene Spieler bringen jede Woche etwas Neues mit.",
  ],
} as const;

export const FEATURES = {
  eyebrow: "Angebot",
  heading: "Was den Dice-Bock ausmacht",
  items: [
    {
      icon: "Dices",
      title: "Spieleabende",
      description:
        "Regelmäßige Termine an festen Tischen – von schnellen Würfelspielen bis zu ausgewachsenen Strategie-Abenden.",
    },
    {
      icon: "CalendarCheck2",
      title: "Tischreservierung per App",
      description:
        "Tische werden über unsere eigene App gebucht – jedes Mitglied sieht in Sekunden, wo noch ein Platz frei ist.",
    },
    {
      icon: "Library",
      title: "Wachsende Spielesammlung",
      description:
        "Von Vereinsklassikern bis zu aktuellen Neuheiten – die Sammlung wächst mit den Wünschen der Mitglieder.",
    },
    {
      icon: "Users",
      title: "Gemeinschaft",
      description:
        "Gäste sind willkommen, neue Mitglieder auch. Der Bock wächst am liebsten über volle Tische.",
    },
  ],
} as const;

export const HOW_IT_WORKS = {
  eyebrow: "Ablauf",
  heading: "So wird aus Interesse ein Spielabend",
  steps: [
    {
      number: "01",
      title: "Mitglied werden",
      description: "Kurz beim Vorstand melden – unten im Kontaktbereich oder persönlich an einem Spielabend.",
    },
    {
      number: "02",
      title: "Tisch reservieren",
      description: "Mit dem Vereinskonto in der App einen freien Tisch und Termin auswählen.",
    },
    {
      number: "03",
      title: "Losspielen",
      description: "Am Tisch ankommen, Spiel auswählen und mit der Runde loslegen.",
    },
  ],
} as const;

export const CONTACT = {
  eyebrow: "Kontakt",
  heading: "Sprecht mit dem Vorstand",
  description:
    "Fragen zur Mitgliedschaft, zu Tischen oder zum nächsten Spieleabend? Der Vorstand meldet sich zurück.",
  board: [
    { role: "1. Vorsitz", name: "Vorstand Dice-Bock e.V.", email: "vorstand@dice-bock.de" },
  ],
} as const;

export const FOOTER = {
  tagline: "Dice-Bock e.V. – Verein für Brett- und Würfelspiele.",
  legalLinks: [
    { href: "/impressum", label: "Impressum" },
    { href: "/datenschutz", label: "Datenschutz" },
  ],
} as const;
