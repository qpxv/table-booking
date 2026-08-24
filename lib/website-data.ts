export const WEBSITE_NAV_LINKS = [
  { href: "#ueber-uns", label: "Über uns" },
  { href: "#angebot", label: "Angebot" },
  { href: "#ablauf", label: "Ablauf" },
  { href: "#kontakt", label: "Kontakt" },
] as const;

export const HERO = {
  eyebrow: "Dice-Bock e.V.",
  headline: "Würfel fallen. Der Bock bleibt.",
  subheadline:
    "Ein Verein für alle, die Warhammer und Tabletop-Strategiespiele lieben. Feste Schlachtfelder, wachsende Armeen.",
  primaryCta: { label: "Kontakt aufnehmen", href: "#kontakt" },
  secondaryCta: { label: "Unser Angebot entdecken", href: "#angebot" },
} as const;

export const ABOUT = {
  eyebrow: "Über uns",
  heading: "Ein Verein, kein Vereinsheim voller Regeln.",
  paragraphs: [
    "Der Dice-Bock e.V. ist aus einer festen Warhammer-Runde entstanden, die irgendwann zu groß für ein Wohnzimmer wurde. Heute treffen wir uns regelmäßig, um Armeen aufzustellen, Terrain aufzubauen und Schlachten zu schlagen – gewonnen oder verloren.",
    "Uns eint der Spieltisch, nicht das Alter oder die Erfahrung. Neulinge lernen die Regeln direkt am Tisch, erfahrene Feldherren bringen jede Woche eine neue Taktik mit.",
  ],
} as const;

export const FEATURES = {
  eyebrow: "Angebot",
  heading: "Was den Dice-Bock ausmacht",
  items: [
    {
      icon: "Dices",
      title: "Schlachtabende",
      description:
        "Regelmäßige Termine an festen Tischen – von Warhammer 40k bis zu anderen Tabletop-Strategiespielen.",
    },
    {
      icon: "CalendarCheck2",
      title: "Schlachtfeld per App reservieren",
      description:
        "Tische werden über unsere eigene App gebucht – jedes Mitglied sieht in Sekunden, wo noch ein Schlachtfeld frei ist.",
    },
    {
      icon: "Library",
      title: "Armeen & Terrain",
      description:
        "Von bemalten Armeen bis zu selbstgebautem Terrain – die Sammlung wächst mit den Wünschen der Mitglieder.",
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
  heading: "So wird aus Interesse ein Schlachtabend",
  steps: [
    {
      number: "01",
      title: "Mitglied werden",
      description: "Kurz beim Vorstand melden – unten im Kontaktbereich oder persönlich an einem Schlachtabend.",
    },
    {
      number: "02",
      title: "Schlachtfeld reservieren",
      description: "Mit dem Vereinskonto in der App einen freien Tisch und Termin auswählen.",
    },
    {
      number: "03",
      title: "Antreten",
      description: "Armee aufstellen, Terrain aufbauen und mit der Runde in die Schlacht ziehen.",
    },
  ],
} as const;

export const CONTACT = {
  eyebrow: "Kontakt",
  heading: "Sprecht mit dem Vorstand",
  description:
    "Fragen zur Mitgliedschaft, zu Schlachtfeldern oder zum nächsten Schlachtabend? Der Vorstand meldet sich zurück.",
  board: [
    { role: "1. Vorsitz", name: "Vorstand Dice-Bock e.V.", email: "vorstand@dice-bock.de" },
  ],
} as const;

export const FOOTER = {
  tagline: "Dice-Bock e.V. – Verein für Warhammer und Tabletop-Strategiespiele.",
  legalLinks: [
    { href: "/impressum", label: "Impressum" },
    { href: "/datenschutz", label: "Datenschutz" },
  ],
} as const;
