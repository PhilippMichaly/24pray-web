const de = {
  appName: '24 pray',
  tagline: 'Organisiere Gebetsketten. Buche deinen Slot. Bete gemeinsam.',
  login: 'Anmelden',
  logout: 'Abmelden',
  checkEmail: 'Prüfe deine E-Mails',
  exploreProjects: 'Projekte entdecken',
  createProject: 'Neues Projekt',
  bookSlot: 'Slot buchen',
  cancel: 'Abbrechen',
  confirm: 'Bestätigen',
  save: 'Speichern',
  delete: 'Löschen',
  share: 'Teilen',
  stats: 'Statistiken',
  settings: 'Einstellungen',
  profile: 'Profil',
  dashboard: 'Dashboard',
  myBookings: 'Meine Buchungen',
  myProjects: 'Meine Projekte',
  public: 'Öffentlich',
  private: 'Privat',
  active: 'Aktiv',
  draft: 'Entwurf',
  paused: 'Pausiert',
  archived: 'Archiviert',
  free: 'Frei',
  booked: 'Belegt',
  slotsBooked: 'Slots belegt',
  reminderVia: 'Erinnerung per',
  email: 'E-Mail',
  telegram: 'Telegram',
  name: 'Name',
  emailAddress: 'E-Mail-Adresse',
  title: 'Titel',
  description: 'Beschreibung',
  startDate: 'Startdatum',
  endDate: 'Enddatum',
  visibility: 'Sichtbarkeit',
  inviteLink: 'Einladungslink',
  copyLink: 'Link kopieren',
  linkCopied: 'Link kopiert!',
  slotBooked: 'Slot gebucht!',
  noAccount: 'Kein Account nötig',
} as const;

// TODO: Add English translations
// const en = { ... } as const;

type TranslationKey = keyof typeof de;

export function t(key: TranslationKey): string {
  return de[key];
}
