export type OccasionType =
  | 'birthday'
  | 'anniversary'
  | 'relationship'
  | 'promotion'
  | 'graduation'
  | 'wedding'
  | 'valentine'
  | 'friendship'
  | 'pet'
  | 'custom';

export interface OccasionEvent {
  id: string;
  name: string;
  relationship: string;
  occasionType: OccasionType;
  customOccasionTitle?: string;
  date: string; // YYYY-MM-DD
  phone?: string;
  email?: string;
  notes?: string;
  photoUrl?: string; // Original photo dataUrl or sample
  editedPhotoUrl?: string; // Edited with stickers/frames
  repeatYearly: boolean;
  remindDaysBefore: number[]; // e.g. [7, 1, 0]
  startYear?: number; // E.g., birth year or wedding year for milestone calculation
  lastWishedAt?: string;
  wishedCount?: number;
  tags?: string[];
  createdAt: string;
  scheduledWish?: ScheduledWish;
}

export interface ScheduledWish {
  id: string;
  eventId: string;
  recipientName: string;
  phone: string;
  occasion: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM, e.g. "00:01" or "09:00"
  message: string;
  status: 'pending' | 'sent' | 'cancelled';
  mode: 'alarm_prompt' | 'webhook_api';
  webhookUrl?: string;
  createdAt: string;
  sentAt?: string;
}

export interface WishOption {
  tone: string;
  title: string;
  message: string;
  emojis: string;
}

export interface GiftIdea {
  title: string;
  reason: string;
  priceRange: string;
}

export interface UserAccount {
  id: string;
  name: string;
  whatsappNumber: string;
  token: string;
  connectedAt: string;
  deliveryMethod?: 'server_daemon' | 'cloud_api' | 'twilio' | 'personal_relay';
  apiConfigured?: boolean;
}

export interface DecorationSuggestion {
  badgeText: string;
  cardHeadline: string;
  cardSubtitle: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  stickersRecommended: string[];
  filterSuggestion: 'warm_glow' | 'golden_hour' | 'fiesta' | 'classic_vintage' | 'romantic_blush';
}


