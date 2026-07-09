// ── Enums ──────────────────────────────────────

export type Role = 'MEMBER' | 'ORGANIZER' | 'ADMIN';
export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
export type ProjectVisibility = 'PUBLIC' | 'PRIVATE';
export type SlotStatus = 'BOOKED' | 'COMPLETED' | 'CANCELLED';
export type NotificationChannel = 'EMAIL' | 'TELEGRAM';
export type MembershipRole = 'MEMBER' | 'ORGANIZER';

// ── Models ─────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  telegramChatId?: string | null;
  createdAt: string;
}

export interface PrayerProject {
  id: string;
  title: string;
  description?: string | null;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  startDate: string;
  endDate: string;
  timezone: string;
  language?: string; // Sprache der Wache (de|en|es|he|ar) — Backlog 5; optional für alte API-Antworten
  slotDurationMinutes: number;
  maskNames?: boolean;
  notifyOnBooking?: boolean;
  linkWhatsapp?: string | null;
  linkTelegram?: string | null;
  linkSignal?: string | null;
  locationName?: string | null;
  inviteToken: string;
  organizerId: string;
  createdAt: string;
}

export interface PrayerSlot {
  id: string;
  projectId: string;
  userId?: string | null;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  guestName?: string | null;
  guestEmail?: string | null;
  guestToken?: string | null; // nur bei Gast-Buchung im Create-Response (§6.3)
  notifyChannel: NotificationChannel;
}

export interface SlotView {
  slotId: string | null; // null wenn FREE (§6.1)
  startTime: string;
  endTime: string;
  status: 'FREE' | 'BOOKED';
  userName?: string | null; // ggf. serverseitig maskiert (§E5)
  isMine: boolean;
}

// ── API Responses ──────────────────────────────

export interface ProjectWithStats extends PrayerProject {
  totalSlots: number;
  bookedSlots: number;
  organizerName: string;
}

export interface BookSlotRequest {
  startTime: string;
  guestName?: string;
  guestEmail?: string;
  notifyChannel: NotificationChannel;
}

// ── Welle 3 ────────────────────────────────────

export interface PrayerRequestView {
  id: string;
  authorName: string | null; // für Anonyme serverseitig maskiert (§E5)
  text: string;
  createdAt: string;
}

export interface ProjectStats {
  completedHours: number;
  perPerson: { name: string | null; hours: number }[];
}
