export const WEBSITE_NAV_LINKS = [
  { href: "#ueber-uns", label: "Über uns" },
  { href: "#angebot", label: "Angebot" },
  { href: "#ablauf", label: "Ablauf" },
  { href: "#kontakt", label: "Kontakt" },
] as const;

// Club founding day, used to compute the "Tage dabei" counter in the Ablauf
// section.
export const CLUB_STATS = {
  foundedAt: "2024-07-19",
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
      images: [
        {
          src: "/website-images/table-reservation-app-screenshot.jpeg",
          alt: "Tischreservierung in der App des Dice-Bock e.V.",
          imageClassName: "object-top-left",
        },
        {
          src: "/website-images/calendar-booking-view.jpeg",
          alt: "Kalenderansicht eines Tisches in der App des Dice-Bock e.V.",
          imageClassName: "object-top-left",
        },
      ],
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
    "Was den Dice-Bock für mich ausmacht, sind die Leute und die Vielfalt. Ob 40k, Heresy oder Kill Team – jeder findet sein System, und der Mal- und Bastelplatz ist richtig gut ausgestattet.",
  name: "Mitglied",
  role: "Neu dabei",
},
{
  quote:
    "Das Schönste ist für mich, dass ein Teil der alten Community wieder zusammengefunden hat. Ich sehe alte Freunde endlich wieder öfter – einen davon kenne ich fast 25 Jahre und hatte ihn eine Weile aus den Augen verloren.",
  name: "Mitglied",
  role: "Mitglied",
},
{
  quote:
    "Mit den Regeln wird fair umgegangen, und am Turniertisch geht es sportlich und respektvoll zu. Wenn man sich mal uneinig ist, wird ruhig ein Judge dazugeholt statt endlos zu diskutieren.",
  name: "Mitglied",
  role: "Mitglied",
},
{
  quote:
    "Über die WhatsApp-Gruppe läuft viel – vom WIP Wednesday bis zu spontanen Terminen. Man muss nur regelmäßig reinschauen, sonst rutscht im Chat schnell mal was nach oben weg.",
  name: "Mitglied",
  role: "Neu dabei",
},
{
  quote:
    "Bei vollem Haus könnte der Raum theoretisch eng werden. In der Praxis ist aber selten wirklich jeder gleichzeitig da, sodass bisher immer genug Platz für Tisch und Armee war.",
  name: "Mitglied",
  role: "Mitglied",
},
{
  quote:
    "Parkplätze sind rar und Internet gibt's im Vereinsraum keins. Das sind für mich die größten Schwachpunkte – auch wenn beides für einen Spieleabend am Ende kaum eine Rolle spielt.",
  name: "Mitglied",
  role: "Mitglied",
},
{
  quote:
    "Im Sommer wird gerade etwas weniger gespielt, viele haben viel um die Ohren. Über die Donnerstage und den 40k-Chat wird trotzdem einiges abgesprochen – man muss nur dabei sein, um es mitzubekommen.",
  name: "Mitglied",
  role: "Mitglied",
},{
  quote:
    "Ich bin und bleibe bei den GW-Systemen, und zwar den großen: 40k, Heresy, AoS. Trench Crusade läuft nebenbei mit. Man merkt schon einen Fokus auf GW – aber irgendwie ist auch für alles andere Platz.",
  name: "Mitglied",
  role: "Mitglied",
},
{
  quote:
    "Ob man als Neuling gut reinkommt, hängt vom Abend ab. Bei 'lass mal zocken und schauen, was passiert' bist du genau richtig. An Turnier- und Listen-Test-Abenden ist es etwas ernster – aber auch das ist mal interessant, um einen Eindruck zu bekommen.",
  name: "Mitglied",
  role: "Neu dabei",
},
{
  quote:
    "Mein schönster Moment bisher war die Freude in den Gesichtern, als ich neues 'Spielzeug' zum Testen mitgebracht habe. Genau dafür komme ich her.",
  name: "Mitglied",
  role: "Mitglied",
},
{
  quote:
    "Ich wurde von Anfang an herzlich aufgenommen, und meine Frau wurde genauso freundlich begrüßt. In einem anderen Laden hatte sie sich mal völlig deplatziert gefühlt, weil alle nur geglotzt haben – hier war das kein Thema.",
  name: "Mitglied",
  role: "Mitglied",
},
{
  quote:
    "Der Verein ist für alle, die sich drauf einlassen und offen sind. Keine Ego-Nummer, keine Toxizität – einfach zusammen das Hobby genießen.",
  name: "Mitglied",
  role: "Mitglied",
},
{
  quote:
    "Komm einfach mal vorbei, kostet ja nichts. Schau es dir an. Und wenn es dir nicht gefällt, sind wir nicht böse – sag uns aber gern, was, damit wir was ändern können.",
  name: "Mitglied",
  role: "Mitglied",
},
{
  quote:
    "Der Zustand vom Gelände ist durchwachsen, von improvisiert bis fertig bemalt. Insgesamt ist die Ausstattung aber gut und wird ständig weiter ausgebessert und erweitert.",
  name: "Mitglied",
  role: "Mitglied",
},
{
  quote:
    "Anbindung und Lage sind gut, mit Öffis kommt man problemlos hin. Nur das Parken ist echt mies.",
  name: "Mitglied",
  role: "Mitglied",
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
