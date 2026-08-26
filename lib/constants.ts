export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  TISCHE: "/tische",
  GASTHISTORIE: "/gasthistorie",
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
} as const;

export const SEARCH_PARAMS = {
  DATE: "date",
  YEAR: "year",
  MONTH: "month",
} as const;

export const MESSAGES = {
  COMMON: {
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
  CONFIRM_DELETE: {
    TABLE_TITLE: "Tisch löschen",
    USER_TITLE: "Benutzer löschen",
    BOOKING_TITLE: "Buchung stornieren",
    GUEST_TITLE: "Gast entfernen",
    GAME_TITLE: "Spiel löschen",
    CONFIRM_LABEL_DELETE: "Löschen",
    CONFIRM_LABEL_CANCEL_BOOKING: "Stornieren",
    CONFIRM_LABEL_REMOVE: "Entfernen",
    BOOKING_DESCRIPTION: "Diese Buchung wirklich stornieren?",
    genericDeleteDescription: (name?: string): string =>
      `„${name}" wirklich löschen? Dies kann nicht rückgängig gemacht werden.`,
    guestRemoveDescription: (name?: string): string =>
      `„${name}" wirklich entfernen? Der Gast wird bei allen Mitgliedern entfernt, die ihn ebenfalls eingetragen haben.`,
  },
} as const;
