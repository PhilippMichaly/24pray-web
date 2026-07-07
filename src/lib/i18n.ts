// i18n-Katalog (Spec §5). `de` = Source of Truth (vollständig), `en` = Skeleton.
// t(key, params?) mit {name}-Interpolation. Status-Enums haben eigene Keys.

const de = {
  // Marke / allgemein
  appName: '24pray',
  tagline: 'Organisiere Gebetsketten. Buche deine Stunde. Betet gemeinsam.',
  loading: 'Lädt …',
  cancel: 'Abbrechen',
  back: 'Zurück',

  // Auth
  login: 'Anmelden',
  logout: 'Abmelden',
  loginSubtitle: 'Wir senden dir einen Login-Link per E-Mail.',
  emailLabel: 'E-Mail',
  emailPlaceholder: 'deine@email.de',
  sendMagicLink: 'Login-Link senden',
  sending: 'Wird gesendet …',
  loginError: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
  checkEmail: 'Prüfe deine E-Mails',
  checkEmailBody: 'Wir haben dir einen Login-Link an {email} geschickt. Klicke den Link, um dich einzuloggen.',
  verifying: 'Link wird verifiziert …',
  loggedIn: 'Eingeloggt!',
  redirecting: 'Du wirst weitergeleitet …',
  linkInvalid: 'Link ungültig',
  linkInvalidBody: 'Dieser Link ist abgelaufen oder wurde bereits verwendet.',
  requestNewLink: 'Neuen Link anfordern',

  // Landing
  exploreProjects: 'Projekte entdecken',
  noAccountNeeded: 'Kein Account nötig zum Mitmachen',

  // Dashboard
  yourProjects: 'Deine Gebetsketten',
  newProject: 'Neue Kette',
  pleaseLogin: 'Bitte {login}.',
  noProjects: 'Noch keine Gebetsketten.',
  noProjectsHint: 'Starte deine erste Kette und lade deine Gemeinde ein.',
  slotsBookedOf: '{booked} von {total} Stunden gehalten',

  // Projekt-Detail
  organizerLabel: 'Organisiert von {name}',
  take: 'Übernehmen',
  free: 'Noch offen',
  bookedBy: '{name}',
  you: 'Du',

  // Projekt anlegen
  newProjectTitle: 'Neue Gebetskette',
  fieldTitle: 'Titel',
  fieldTitlePlaceholder: 'z. B. Nachtgebet',
  fieldDescription: 'Anlass',
  optional: 'optional',
  fieldStart: 'Start',
  fieldEnd: 'Ende',
  fieldVisibility: 'Sichtbarkeit',
  visibilityPrivate: 'Privat (nur per Einladungslink)',
  visibilityPublic: 'Öffentlich (für alle sichtbar)',
  createProject: 'Kette erstellen',
  creating: 'Wird erstellt …',
  errTitleRequired: 'Bitte einen Titel angeben.',
  errDatesRequired: 'Bitte Start und Ende angeben.',
  errEndAfterStart: 'Das Ende muss nach dem Start liegen.',

  // Join
  invitedToTitle: 'Du bist eingeladen',
  invitedToLead: '{name} lädt dich ein, eine Stunde zu übernehmen.',
  toProjectTakeSlot: 'Zur Kette & Stunde übernehmen',
  invitationInvalid: 'Diese Einladung ist ungültig oder abgelaufen.',

  // Theme
  themeLight: 'Hell',
  themeDark: 'Dunkel',
  themeSystem: 'System',
  toggleTheme: 'Design wechseln',

  // Zeitzone
  timesInTz: 'Zeiten in {tz}',

  // Status-Enums (Projekt)
  status_DRAFT: 'Entwurf',
  status_ACTIVE: 'Aktiv',
  status_PAUSED: 'Pausiert',
  status_ARCHIVED: 'Archiviert',
} as const;

// English skeleton — nur ein Teil belegt, Rest fällt via Fallback auf `de` zurück (Welle 3).
const en: Partial<Record<keyof typeof de, string>> = {
  appName: '24pray',
  login: 'Sign in',
  logout: 'Sign out',
  loading: 'Loading …',
  cancel: 'Cancel',
  themeLight: 'Light',
  themeDark: 'Dark',
  themeSystem: 'System',
  noAccountNeeded: 'No account needed to join',
};

type TranslationKey = keyof typeof de;
type Locale = 'de' | 'en';

const catalogs: Record<Locale, Partial<Record<TranslationKey, string>>> = { de, en };

// v1: fester Default `de`. Welle 3 macht das umschaltbar (Context/Cookie).
const currentLocale: Locale = 'de';

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const raw = catalogs[currentLocale][key] ?? de[key];
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}
