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
  notifyChannel: NotificationChannel;
}

export interface SlotView {
  startTime: string;
  endTime: string;
  status: 'FREE' | 'BOOKED';
  userName?: string | null;
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
