export const WEBSITE_NAV_LINKS = [
  { href: "#ueber-uns", label: "Über uns" },
  { href: "#angebot", label: "Angebot" },
  { href: "#ablauf", label: "Ablauf" },
  { href: "#kontakt", label: "Kontakt" },
] as const;

// Exact founding day isn't tracked anywhere, so this is an approximation
// used to compute the "Tage dabei" counter in the Ablauf section.
export const CLUB_STATS = {
  foundedAt: "2024-01-01",
  memberLabel: "Mitglieder",
  daysLabel: "Tage dabei",
  bookingLabel: "Buchungen",
} as const;

export const HERO = {
  eyebrow: "Dice-Bock e.V.",
  headline: "Würfel fallen. Der Bock bleibt.",
  subheadline:
    "Würfeln, basteln, bemalen, spielen.\n\nVon Warhammer bis Brettspielabend, mitten in Köln.",
  primaryCta: { label: "Kontakt aufnehmen", href: "#kontakt" },
  secondaryCta: { label: "Unser Angebot entdecken", href: "#angebot" },
} as const;

export const ABOUT = {
  eyebrow: "Über uns",
  heading: "Ein Verein - un mer sin eins am Tisch",
  paragraphs: [
  "Der Dice-Bock e.V. entstand aus einer einfachen Idee: ein paar Leute, die einen festen Ort zum gemeinsamen Zocken schaffen wollten. Also haben wir ihn geschaffen und von da an nahm alles seinen Lauf. Heute stellen wir Armeen auf, bauen Terrain, bemalen Miniaturen und holen auch mal die Brettspiele raus.",
"Uns eint der Spieltisch, nicht das Alter oder die Erfahrung. Neulinge lernen die Regeln direkt am Tisch, erfahrene Feldherren bringen jede Woche eine neue Taktik mit. Ob Pinsel, Bastelmesser oder Würfelbecher – bei uns findest du Platz, Zeit und Leute für dein Hobby."  
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
        "Von Warhammer 40k bis hin zu anderen Tabletop-Strategiespielen.",
      images: [
        { src: "/website-images/yellow-and-red-fighting.jpeg", alt: "Gelbe und rote Armee im Gefecht" },
        { src: "/website-images/long-table-fight.jpeg", alt: "Schlacht am langen Tisch" },
      ],
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
        "Von bemalten Armeen bis zu selbstgebautem Terrain – die Sammlung wächst.",
      images: [
        { src: "/website-images/army-picture-left.jpeg", alt: "Bemalte Armee des Dice-Bock e.V." },
        { src: "/website-images/3-figures-standing.jpeg", alt: "Bemalte Miniaturen des Dice-Bock e.V." },
      ],
    },
    {
      icon: "Users",
      title: "Gemeinschaft",
      description:
        "Gäste sind willkommen, neue Mitglieder auch. Egal ob du seit Jahren malst oder deine erste Armee gerade erst auspackst.",
      images: [
        { src: "/website-images/all-tables-visible.jpeg", alt: "Alle Tische beim Dice-Bock e.V." },
        { src: "/website-images/shelf-with-things.jpeg", alt: "Regal mit Vereinsmaterial des Dice-Bock e.V." },
      ],
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
    {
      quote:
        "Was mich am meisten überzeugt hat, ist die Herzlichkeit der Leute. Ich bin erst seit kurzem dabei, aber ich wurde von der ersten Minute an eingebunden, kein Ellbogen-Vibe, einfach nur Lust am gemeinsamen Hobby.",
      name: "Laura Nowak",
      role: "Neu dabei",
    },
    {
      quote:
        "Was den Dice-Bock für mich besonders macht, ist die Vielfalt: die einen spielen Warhammer 40k, andere Heresy, wieder andere Kill Team. Jeder findet sein System, ohne dass es eine Zwei-Klassen-Gesellschaft gibt.",
      name: "Jan-Philipp Reuß",
      role: "Mitglied seit 2023",
    },
    {
      quote:
        "Der Mal- und Bastelplatz ist wirklich gut ausgestattet. Ich hab vorher zuhause auf dem Küchentisch gepinselt, jetzt hab ich Licht, Platz und Leute, die einem beim Airbrush über die Schulter schauen.",
      name: "Michael Brandt",
      role: "Bastel- und Malfan",
    },
    {
      quote:
        "Die Vielfalt an Gelände und Plattengestaltung hat mich überrascht. Es gibt nicht nur ein Standard-Battlefield, sondern richtig viele unterschiedliche Tische, an denen ständig weitergebaut wird.",
      name: "Verena Kuhn",
      role: "Terrain-Team",
    },
    {
      quote:
        "Klar, Parkplätze sind rar und WLAN gibt's auch nicht, aber ehrlich, dafür bin ich da nicht. Ich will würfeln und quatschen, nicht am Handy hängen, und einen Parkplatz findet man am Ende doch immer.",
      name: "Dennis Achterberg",
      role: "Mitglied seit 2022",
    },
    {
      quote:
        "Ich hätte gedacht, der Raum wird bei vollem Haus eng, aber tatsächlich sind so gut wie nie alle gleichzeitig da. Bisher hatte ich immer genug Platz für Tisch, Armee und Ellenbogen-Freiheit.",
      name: "Nora Vetter",
      role: "Mitglied seit 2021",
    },
    {
      quote:
        "Ich bin über Kill Team eingestiegen, weil mir 40k am Anfang zu groß war. Genau diese Einstiegsmöglichkeit über die kleineren Systeme hat mir den Umstieg leicht gemacht.",
      name: "Kevin Ostermann",
      role: "Kill-Team-Spieler",
    },
    {
      quote:
        "Über die WhatsApp-Gruppe läuft wirklich viel, von spontanen 40k-Terminen bis zum WIP Wednesday, wo jeder zeigt, woran er gerade pinselt. Man muss nur ab und zu reinschauen, dann verpasst man nichts.",
      name: "Christina Wallner",
      role: "Mitglied seit 2020",
    },
    {
      quote:
        "Regeln werden hier sauber und fair ausgelegt, und wenn zwei sich mal uneinig sind, wird ruhig ein Judge dazugeholt statt zu diskutieren, bis der Abend vorbei ist. Genau die Streitkultur, die ein Verein braucht.",
      name: "Andreas Falk",
      role: "Judge",
    },
    {
      quote:
        "Mir war Sicherheit im Vereinsraum wichtig, bevor ich beigetreten bin, und ich wurde da offen und ehrlich informiert, nichts wurde schöngeredet. Das hat mir das Vertrauen gegeben, mich anzumelden.",
      name: "Simone Barthel",
      role: "Mitglied seit 2024",
    },
    {
      quote:
        "Würde ich weiterempfehlen? Auf jeden Fall. Größtes Highlight ist für mich die Atmosphäre, man merkt einfach, dass hier keiner nur seine eigene Armee im Blick hat, sondern den ganzen Verein.",
      name: "Patrick Sommer",
      role: "Wiedereinsteiger",
    },
    {
      quote:
        "Herzliche Leute, jede Menge unterschiedliche Systeme und ein Bastelplatz, der sich sehen lassen kann. Genau das hatte ich gesucht.",
      name: "Isabel Krome",
      role: "Neu dabei",
    },
  ],
} as const;

export const HOW_IT_WORKS = {
  eyebrow: "Ablauf",
  heading: "So wird aus Interesse ein Schlachtabend",
  description: "Drei Schritte vom ersten Kontakt bis zur ersten Schlacht am eigenen Tisch.",
  tabs: [
    {
      id: "mitglied",
      label: "Mitglied",
      steps: [
        {
          number: "01",
          icon: "UserPlus",
          title: "Mitglied werden",
          description: "Unten im Kontaktbereich beim Vorstand melden.",
        },
        {
          number: "02",
          icon: "CalendarCheck2",
          title: "Schlachtfeld reservieren",
          description: "Mit dem Vereinskonto in der App einen freien Tisch und Spielpartner finden.",
        },
        {
          number: "03",
          icon: "Swords",
          title: "Antreten",
          description: "Armee aufstellen, Terrain aufbauen und mit der Runde in die Schlacht ziehen.",
        },
      ],
    },
    {
      id: "gast",
      label: "Gast",
      steps: [
        {
          number: "01",
          icon: "MessageCircle",
          title: "Kontakt aufnehmen",
          description: "Entweder im Kontaktbereich oder bei einem Mitglied melden.",
        },
        {
          number: "02",
          icon: "CalendarClock",
          title: "Termin vereinbaren",
          description: "Wir stimmen gemeinsam einen freien Termin für deinen ersten Besuch ab.",
        },
        {
          number: "03",
          icon: "Eye",
          title: "Reinschnuppern",
          description: "Bei einem Schlachtabend vorbeikommen, mitspielen und den Verein kennenlernen.",
          highlight: {
            word: "mitspielen",
            title: "Mitspielen",
            description:
              "Vorbeischauen und zugucken ist bei uns immer kostenlos. Beim ersten Besuch darfst du auch kostenlos mitspielen. Ab dem zweiten Mal kostet ein Spieltag 5€.",
          },
        },
      ],
    },
  ],
} as const;

export const CONTACT = {
  eyebrow: "Kontakt",
  heading: "Bereit beizutreten?",
  description:
    "Fragen zur Mitgliedschaft, zu Schlachtfeldern oder zum nächsten Schlachtabend? Der Vorstand meldet sich schnellstmöglich zurück.",
  board: [
    { role: "Mitgründer & Vorstand", name: "Tim, Max & Nick", email: "dice-bock@outlook.de" },
  ],
  channels: [
    { icon: "Discord", label: "Discord", href: "https://discord.gg/jKApNeC7Hj" },
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
    { href: "https://discord.gg/jKApNeC7Hj", label: "Discord beitreten" },
  ],
} as const;
