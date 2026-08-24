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
  description:
    "Vier Dinge, die jeden Schlachtabend zusammenhalten – von der Terminfindung bis zur Armee im Schrank.",
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
        "Gäste sind willkommen, neue Mitglieder auch. Der Bock wächst am liebsten über volle Tische, egal ob du seit Jahren malst oder deine erste Armee gerade erst auspackst.",
    },
  ],
} as const;

export const TESTIMONIALS = {
  eyebrow: "Stimmen aus dem Verein",
  heading: "Was Mitglieder über den Dice-Bock sagen",
  items: [
    {
      quote:
        "Ich bin als kompletter Neuling reingekommen und hatte nach einem Abend schon meine erste Armee auf dem Tisch stehen. Keiner hat komisch geguckt, dass ich noch nicht wusste, wie man einen Würfelwurf modifiziert. Genau diese Geduld am Tisch ist es, die mich seitdem jede Woche wiederkommen lässt.",
      name: "Jonas Berger",
      role: "Mitglied seit 2023",
    },
    {
      quote: "Endlich ein Verein, bei dem die Tischreservierung nicht über einen Zettel am Kühlschrank läuft.",
      name: "Elena Vogt",
      role: "Mitglied seit 2021",
    },
    {
      quote:
        "Für mich ist der Dice-Bock vor allem die Terrain-Werkstatt am Donnerstag. Da wird gebaut, gefachsimpelt und nebenbei die nächste Kampagne geplant. Manchmal kommt dabei mehr Terrain raus als an einem ganzen Wochenende alleine zuhause, einfach weil man sich gegenseitig anspornt.",
      name: "Timo Reuter",
      role: "Terrain-Team",
    },
    {
      quote:
        "Ich male seit Jahren Miniaturen, aber erst hier hatte ich wieder regelmäßig Leute, gegen die ich tatsächlich antreten konnte, statt die Armee nur im Regal zu bewundern.",
      name: "Sabine Krüger",
      role: "Hobby-Malerin",
    },
    {
      quote:
        "Meine Tochter und ich sind zusammen beigetreten. Sie hat mit 12 ihre erste eigene Armee zusammengestellt und wird am Tisch genauso ernst genommen wie alle anderen. Das war für mich der eigentliche Grund zu bleiben, nicht die Regeln.",
      name: "Markus Lindner",
      role: "Mitglied seit 2022",
    },
    {
      quote: "Die Schlachtabende fallen so gut wie nie aus. Klingt banal, ist aber der Grund, warum ich bleibe.",
      name: "Nadine Fischer",
      role: "Mitglied seit 2019",
    },
    {
      quote:
        "Als Wiedereinsteiger nach zehn Jahren Pause war ich überrascht, wie schnell mir am Tisch geholfen wurde, wieder reinzukommen. Regeln erklären statt Punkte zählen, das hat mir wirklich gefehlt.",
      name: "Philipp Adler",
      role: "Wiedereinsteiger",
    },
    {
      quote: "Ich komme eigentlich nur wegen der Community.",
      name: "Carla Hoffmann",
      role: "Mitglied seit 2020",
    },
    {
      quote:
        "Der Vorstand ist bei Fragen zur Mitgliedschaft immer schnell erreichbar. Von der ersten Nachricht bis zum ersten Schlachtabend hat es bei mir keine zwei Wochen gedauert, inklusive einer kompletten Einführung ins Regelwerk.",
      name: "David Schuster",
      role: "Mitglied seit 2024",
    },
    {
      quote: "Bester Verein.",
      name: "Robin Kaiser",
      role: "Mitglied seit 2023",
    },
    {
      quote:
        "Ich muss ehrlich sagen, ich war anfangs skeptisch, weil ich in einem anderen Verein mal richtig schlechte Erfahrungen gemacht habe, wo neue Mitglieder eigentlich nur als Kanonenfutter für die alten Hasen gedient haben und man wochenlang nur zugucken durfte, bevor man überhaupt mal ein eigenes Modell auf den Tisch stellen durfte. Beim Dice-Bock war das komplett anders. Schon am zweiten Abend durfte ich mit einer geliehenen Armee mitspielen, jemand hat mir in Ruhe die Grundregeln erklärt, ohne dabei genervt zu wirken, und am Ende des Abends hatte ich schon eine Telefonnummer für den nächsten Malabend. Mittlerweile bin ich selbst derjenige, der neuen Leuten die Regeln erklärt, und ich versuche, genau die gleiche Geduld zurückzugeben, die ich damals bekommen habe.",
      name: "Anna-Lena Wolter",
      role: "Mitglied seit 2018",
    },
    {
      quote: "Feste Tische, feste Zeiten, keine Ausreden mehr.",
      name: "Ben Thalheim",
      role: "Mitglied seit 2022",
    },
    {
      quote:
        "Man unterschätzt total, wie viel Zeit man spart, wenn die Tischreservierung digital läuft. Früher haben wir gefühlt jede Woche eine halbe Stunde in der WhatsApp-Gruppe verbracht, um herauszufinden, wer wann kommt und ob ein Tisch frei ist. Jetzt schaue ich kurz in die App und weiß Bescheid.",
      name: "Katharina Lenz",
      role: "Mitglied seit 2021",
    },
    {
      quote: "Die Terrain-Werkstatt ist mein liebster Abend der Woche.",
      name: "Ole Petersen",
      role: "Terrain-Team",
    },
    {
      quote:
        "Ich bin über einen Kollegen zum Dice-Bock gekommen, der mich quasi mit sanfter Gewalt zu einem Schlachtabend mitgeschleppt hat, weil ich vorher noch nie Warhammer gespielt hatte, geschweige denn irgendein Tabletop-Strategiespiel, und ich hatte auch ehrlich gesagt keine große Lust, weil ich dachte, das wäre nur was für Leute, die schon seit Jahren dabei sind und ihre Armeen bis ins letzte Detail auswendig kennen. Am Ende habe ich einen der besten Abende seit Langem gehabt, weil mir jemand geduldig Schritt für Schritt erklärt hat, wie die Runden ablaufen, und ich sogar noch gewonnen habe, was vermutlich reines Anfängerglück war.",
      name: "Finn Albrecht",
      role: "Mitglied seit 2024",
    },
    {
      quote: "Toller Verein, tolle Leute, tolle Tische.",
      name: "Miriam Groth",
      role: "Mitglied seit 2020",
    },
    {
      quote:
        "Was mich am meisten überzeugt hat, ist, wie ernst der Vorstand die Mitgliedschaft nimmt, ohne dabei bürokratisch zu wirken. Man merkt einfach, dass hier Leute mit Herzblut organisieren.",
      name: "Sebastian Kraus",
      role: "Mitglied seit 2019",
    },
    {
      quote:
        "Die App ist für mich der eigentliche Grund, warum ich regelmäßiger komme als früher. Ich sehe auf einen Blick, welcher Tisch frei ist, buche in zehn Sekunden und muss niemanden erst fragen, ob noch Platz ist.",
      name: "Leon Vogt",
      role: "Mitglied seit 2022",
    },
    {
      quote: "Die Reservierungs-App ist verdammt gut gemacht, ehrlich gesagt besser als bei manchen Restaurants.",
      name: "Julia Sander",
      role: "Mitglied seit 2023",
    },
    {
      quote:
        "Als jemand, der beruflich selbst Software baut, bin ich ziemlich anspruchsvoll, was Apps angeht, aber die Buchungs-App vom Dice-Bock macht wirklich alles richtig: schnell, übersichtlich, keine unnötigen Klicks. Genau so sollte ein Tool für einen Verein aussehen.",
      name: "Tobias Ehrlich",
      role: "Mitglied seit 2021",
    },
  ],
} as const;

export const HOW_IT_WORKS = {
  eyebrow: "Ablauf",
  heading: "So wird aus Interesse ein Schlachtabend",
  description: "Drei Schritte vom ersten Kontakt bis zur ersten Schlacht am eigenen Tisch.",
  steps: [
    {
      number: "01",
      icon: "UserPlus",
      title: "Mitglied werden",
      description: "Kurz beim Vorstand melden – unten im Kontaktbereich oder persönlich an einem Schlachtabend.",
    },
    {
      number: "02",
      icon: "CalendarCheck2",
      title: "Schlachtfeld reservieren",
      description: "Mit dem Vereinskonto in der App einen freien Tisch und Termin auswählen.",
    },
    {
      number: "03",
      icon: "Swords",
      title: "Antreten",
      description: "Armee aufstellen, Terrain aufbauen und mit der Runde in die Schlacht ziehen.",
    },
  ],
} as const;

export const CONTACT = {
  eyebrow: "Kontakt",
  heading: "Bereit beizutreten?",
  description:
    "Fragen zur Mitgliedschaft, zu Schlachtfeldern oder zum nächsten Schlachtabend? Der Vorstand meldet sich schnellstmöglich zurück.",
  board: [
    { role: "Mitgründer & Vorstand", name: "Max Schwiperich", email: "vorstand@dice-bock.de" },
  ],
  channels: [
    { icon: "WhatsApp", label: "WhatsApp", href: "#" },
    { icon: "Discord", label: "Discord", href: "#" },
  ],
} as const;

export const FOOTER = {
  navLabel: "Navigation",
  legalLabel: "Rechtliches",
  legalLinks: [
    { href: "/impressum", label: "Impressum" },
    { href: "/datenschutz", label: "Datenschutz" },
  ],
  communityLabel: "Community",
  communityLinks: [
    { href: "#", label: "Discord beitreten" },
    { href: "#", label: "WhatsApp-Gruppe" },
  ],
} as const;
