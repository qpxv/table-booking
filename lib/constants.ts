export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  TISCHE: "/tische",
  GASTHISTORIE: "/gasthistorie",
  SPIELERSUCHE: "/spielersuche",
  EVENTS: "/events",
  ADMIN_TISCHE: "/admin/tische",
  ADMIN_SPIELE: "/admin/spiele",
  ADMIN_USERS: "/admin/users",
  ADMIN_GETRAENKE: "/admin/getraenke",
  IMPRESSUM: "/impressum",
  DATENSCHUTZ: "/datenschutz",
  tischDetail: (tableId: string): string => `/tische/${tableId}`,
} as const;

// Routes proxy.ts (Next.js middleware) needs to reason about without a DB
// lookup: which paths are reachable with no session cookie, and which
// should bounce an already-authenticated visitor away.
export const PUBLIC_ROUTES = new Set<string>([
  ROUTES.LOGIN,
  ROUTES.IMPRESSUM,
  ROUTES.DATENSCHUTZ,
]);
export const REDIRECT_IF_AUTHENTICATED_ROUTES = new Set<string>([ROUTES.LOGIN]);

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
} as const;

export const DIALOG_MODE = {
  CREATE: "create",
  EDIT: "edit",
  JOIN: "join",
} as const;

export const CONFIRM_MODE = {
  TABLE: "table",
  USER: "user",
  BOOKING: "booking",
  GUEST: "guest",
  GAME: "game",
  PLAYER_SEARCH: "player_search",
  EVENT: "event",
} as const;

export const SEARCH_PARAMS = {
  DATE: "date",
  YEAR: "year",
  MONTH: "month",
} as const;

// Tags for `unstable_cache` entries that back rarely-changing admin-managed
// lists. The owning service busts its tag on every mutation.
export const CACHE_TAGS = {
  GAMES: "games",
  TABLES: "tables",
} as const;

export const MESSAGES = {
  COMMON: {
    OK: "Erledigt.",
    GENERIC_ERROR: "Ein Fehler ist aufgetreten.",
    UNAUTHORIZED: "Nicht berechtigt.",
    NOT_AUTHENTICATED: "Nicht angemeldet.",
    INVALID_INPUT: "Ungültige Eingabe.",
  },
  VALIDATION: {
    NAME_REQUIRED: "Name ist erforderlich",
    EMAIL_INVALID: "Ungültige E-Mail-Adresse",
    PASSWORD_REQUIRED: "Passwort ist erforderlich",
    CURRENT_PASSWORD_REQUIRED: "Aktuelles Passwort ist erforderlich",
    PASSWORD_MIN_LENGTH: "Passwort muss mindestens 8 Zeichen haben",
    PASSWORD_CONFIRM_REQUIRED: "Bitte Passwort bestätigen",
    PASSWORDS_DO_NOT_MATCH: "Passwörter stimmen nicht überein.",
    MEMBER_ID_REQUIRED: "Mitgliedsnummer ist erforderlich",
    IBAN_INVALID: "Ungültige IBAN.",
    START_BEFORE_END: "Start muss vor dem Ende liegen.",
    START_IN_FUTURE: "Der Zeitraum muss in der Zukunft liegen.",
    SYSTEM_REQUIRED: "Bitte ein System angeben.",
    MATCH_TYPE_REQUIRED: "Bitte einen Spieltyp angeben.",
    PRIORITY_INVALID: "Bitte eine positive Zahl oder leer lassen.",
    TITLE_REQUIRED: "Titel ist erforderlich",
  },
  AUTH: {
    SIGN_IN_FAILED: "Anmeldung fehlgeschlagen.",
  },
  TABLE: {
    CREATED: "Tisch erstellt.",
    UPDATED: "Tisch aktualisiert.",
    DELETED: "Tisch gelöscht.",
    NOT_FOUND: "Tisch nicht gefunden.",
    ACTIVATED: "Tisch aktiviert.",
    DEACTIVATED: "Tisch deaktiviert.",
    MULTIPLE_ENABLED: "Mehrfachbuchung aktiviert.",
    MULTIPLE_DISABLED: "Mehrfachbuchung deaktiviert.",
    OVERLAP: "Der Tisch ist im gewählten Zeitraum bereits belegt.",
  },
  GAME: {
    CREATED: "Spiel erstellt.",
    UPDATED: "Spiel aktualisiert.",
    DELETED: "Spiel gelöscht.",
  },
  DRINKS: {
    ADDED: "Getränk hinzugefügt.",
    REMOVED: "Getränk entfernt.",
    BUDGET_UPDATED: "Getränkebudget aktualisiert.",
  },
  USER: {
    CREATED: "Benutzer erstellt.",
    UPDATED: "Benutzer aktualisiert.",
    DELETED: "Benutzer gelöscht.",
    ROLE_UPDATED: "Rolle aktualisiert.",
    PASSWORD_RESET: "Passwort zurückgesetzt.",
    CANNOT_DELETE_HIDDEN: "Dieser Benutzer kann nicht gelöscht werden.",
  },
  GUEST: {
    REMOVED: "Gast entfernt.",
    INVALID_GUEST: "Ungültiger Gast.",
    INVALID_MEMBER: "Ungültiges Mitglied.",
    NOT_FOUND: "Eintrag nicht gefunden.",
  },
  BOOKING: {
    CREATED: "Buchung erstellt.",
    UPDATED: "Buchung aktualisiert.",
    CANCELLED: "Buchung storniert.",
    NOT_FOUND: "Buchung nicht gefunden.",
    EVENT_NOT_FOUND: "Termin nicht gefunden.",
    JOINED: "Du bist jetzt angemeldet.",
    LEFT: "Du bist abgemeldet.",
    CREATOR_CANNOT_LEAVE: "Der Ersteller kann den Termin nicht verlassen.",
    NO_BOOKING_SELECTED: "Keine Buchung ausgewählt.",
  },
  EVENT: {
    CREATED: "Event erstellt.",
    UPDATED: "Event aktualisiert.",
    DELETED: "Event gelöscht.",
    NOT_FOUND: "Event nicht gefunden.",
    JOINED: "Du bist jetzt angemeldet.",
    LEFT: "Du bist abgemeldet.",
  },
  PLAYER_SEARCH: {
    CREATED: "Spielersuche erstellt.",
    DELETED: "Spielersuche gelöscht.",
    NOT_FOUND: "Spielersuche nicht gefunden.",
    NOT_AVAILABLE: "Diese Spielersuche ist nicht mehr verfügbar.",
    CANNOT_RESPOND_OWN: "Du kannst nicht auf deine eigene Suche antworten.",
    NO_PRIORITY_TABLES: "Es ist kein Tisch für die automatische Buchung freigegeben.",
    NO_TABLE_FREE: "Im gewünschten Zeitraum ist kein Tisch frei. Bitte andere Uhrzeit wählen.",
    TABLE_UNAVAILABLE: "Aktuell ist zu dieser Zeit kein Tisch frei.",
    INTEREST_SENT: "Interesse gesendet.",
    ALREADY_RESPONDED: "Du hast bereits Interesse gezeigt.",
    INTEREST_NOT_FOUND: "Diese Anfrage ist nicht mehr verfügbar.",
    INTEREST_DECLINED: "Anfrage abgelehnt.",
    booked: (tableName: string): string => `Gebucht: ${tableName}.`,
  },
  PAYMENT: {
    MARKED_PAID: "Als bezahlt markiert.",
    MARKED_UNPAID: "Als offen markiert.",
    COPIED_TO_CLIPBOARD: "In Zwischenablage kopiert.",
  },
  SETTINGS: {
    PROFILE_UPDATED: "Profil aktualisiert.",
    PASSWORD_CHANGED: "Passwort geändert.",
    PAYMENT_DETAILS_UPDATED: "Zahlungsdetails aktualisiert.",
    INVALID_PASSWORD: "Aktuelles Passwort ist falsch.",
    PASSWORD_TOO_SHORT: "Passwort ist zu kurz.",
    PASSWORD_TOO_LONG: "Passwort ist zu lang.",
    CREDENTIAL_ACCOUNT_NOT_FOUND: "Für dieses Konto ist kein Passwort hinterlegt.",
    CHANGE_EMAIL_DISABLED: "E-Mail-Änderung ist deaktiviert.",
  },
  FORCE_PASSWORD_CHANGE: {
    TITLE: "Passwort festlegen",
    DESCRIPTION:
      "Dein Konto wurde mit einem vom Admin vergebenen Passwort eingerichtet. Lege jetzt dein eigenes Passwort fest, um fortzufahren.",
  },
  // Push notification copy. Each builder takes already-formatted strings
  // (names, table/event titles, a human date label from lib/datetime) and
  // returns { title, body }. The call site adds the click-through url.
  NOTIFICATIONS: {
    eventCreated: (title: string, dateLabel: string, location: string | null) => ({
      title: `Neues Event: ${title}`,
      body: location ? `${dateLabel}, ${location}` : dateLabel,
    }),
    eventMoved: (title: string, dateLabel: string) => ({
      title: `Event verschoben: ${title}`,
      body: `Neuer Termin: ${dateLabel}`,
    }),
    eventCancelled: (title: string, dateLabel: string) => ({
      title: `Event abgesagt: ${title}`,
      body: dateLabel,
    }),
    eventJoined: (memberName: string, title: string) => ({
      title: `${memberName} ist beim Event dabei`,
      body: title,
    }),

    bookingAddedParticipant: (creatorName: string, tableName: string, dateLabel: string) => ({
      title: `${creatorName} hat dich zu einem Termin hinzugefügt`,
      body: `${tableName}, ${dateLabel}`,
    }),
    bookingRemovedParticipant: (tableName: string, dateLabel: string) => ({
      title: "Von einem Termin entfernt",
      body: `${tableName}, ${dateLabel}`,
    }),
    bookingMoved: (editorName: string, tableName: string, dateLabel: string) => ({
      title: `${editorName} hat einen Termin verschoben`,
      body: `${tableName}, neuer Termin: ${dateLabel}`,
    }),
    bookingCancelled: (cancellerName: string, tableName: string, dateLabel: string) => ({
      title: `${cancellerName} hat einen Termin storniert`,
      body: `${tableName}, ${dateLabel}`,
    }),
    bookingJoined: (memberName: string, tableName: string, dateLabel: string) => ({
      title: `${memberName} ist deinem Termin beigetreten`,
      body: `${tableName}, ${dateLabel}`,
    }),
    bookingLeft: (memberName: string, tableName: string, dateLabel: string) => ({
      title: `${memberName} hat deinen Termin verlassen`,
      body: `${tableName}, ${dateLabel}`,
    }),

    playerSearchInterest: (
      memberName: string,
      system: string,
      matchType: string,
      dateLabel: string,
    ) => ({
      title: `${memberName} hat Interesse an deiner Spielersuche`,
      body: `${system}, ${matchType}, ${dateLabel}`,
    }),
    playerSearchBooked: (
      opponentName: string,
      tableName: string,
      system: string,
      dateLabel: string,
    ) => ({
      title: `Match gebucht: ${tableName}`,
      body: `Gegen ${opponentName}, ${system}, ${dateLabel}`,
    }),
    playerSearchDeclined: (creatorName: string, system: string, dateLabel: string) => ({
      title: `${creatorName} hat deine Anfrage abgelehnt`,
      body: `${system}, ${dateLabel}`,
    }),
    playerSearchTableLost: (system: string, dateLabel: string) => ({
      title: "Kein Tisch mehr frei für deine Spielersuche",
      body: `${system}, ${dateLabel}. Bitte eine andere Uhrzeit wählen.`,
    }),

    passwordReset: () => ({
      title: "Passwort zurückgesetzt",
      body: "Ein Admin hat dein Passwort zurückgesetzt. Beim nächsten Login musst du ein neues vergeben.",
    }),
    guestPaymentToggled: (paid: boolean, guestName: string, dateLabel: string) => ({
      title: paid ? "Gastzahlung als bezahlt markiert" : "Gastzahlung als offen markiert",
      body: `${guestName}, ${dateLabel}`,
    }),
  },
  CONFIRM_DELETE: {
    TABLE_TITLE: "Tisch löschen",
    USER_TITLE: "Benutzer löschen",
    BOOKING_TITLE: "Buchung stornieren",
    GUEST_TITLE: "Gast entfernen",
    GAME_TITLE: "Spiel löschen",
    PLAYER_SEARCH_TITLE: "Spielersuche löschen",
    EVENT_TITLE: "Event löschen",
    CONFIRM_LABEL_DELETE: "Löschen",
    CONFIRM_LABEL_CANCEL_BOOKING: "Stornieren",
    CONFIRM_LABEL_REMOVE: "Entfernen",
    BOOKING_DESCRIPTION: "Diese Buchung wirklich stornieren?",
    PLAYER_SEARCH_DESCRIPTION: "Diese Spielersuche wirklich löschen?",
    EVENT_DESCRIPTION: "Dieses Event wirklich löschen? Alle Anmeldungen gehen verloren.",
    genericDeleteDescription: (name?: string): string =>
      `„${name}" wirklich löschen? Dies kann nicht rückgängig gemacht werden.`,
    guestRemoveDescription: (name?: string): string =>
      `„${name}" wirklich entfernen? Der Gast wird bei allen Mitgliedern entfernt, die ihn ebenfalls eingetragen haben.`,
  },
} as const;
