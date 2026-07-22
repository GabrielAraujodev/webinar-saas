export const APP_NAME = 'Webinar SaaS';

export const ROLES = {
  ADMIN: 'admin',
  PRESENTER: 'presenter',
  ATTENDEE: 'attendee',
};

export const WEBINAR_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  ENDED: 'ended',
};

export const WEBINAR_TYPE = {
  LIVE: 'live',
  RECORDED: 'recorded',
};

export const VIDEO_PLATFORM = {
  YOUTUBE: 'youtube',
  VIMEO: 'vimeo',
};

export const EMAIL_TYPE = {
  CONFIRMATION: 'confirmation',
  REMINDER: 'reminder',
  REPLAY: 'replay',
};

export const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'page_view',
  REGISTRATION: 'registration',
  JOIN: 'join',
  LEAVE: 'leave',
  CTA_CLICK: 'cta_click',
  CTA_VIEW: 'cta_view',
  POLL_RESPONSE: 'poll_response',
  CHAT_MESSAGE: 'chat_message',
  VIDEO_PROGRESS: 'video_progress',
};

export const BLOCK_TYPES = {
  HERO: 'hero',
  BENEFITS: 'benefits',
  TESTIMONIALS: 'testimonials',
  HOST_BIO: 'host_bio',
  FAQ: 'faq',
  TRAILER: 'trailer',
  PROOF_BADGES: 'proof_badges',
  FORM: 'form',
  COUNTDOWN: 'countdown',
  TEXT: 'text',
};

export const DEFAULT_THEME = {
  primaryColor: '#3366ff',
  backgroundColor: '#ffffff',
  textColor: '#101828',
  accentColor: '#f79009',
  fontFamily: 'Inter',
  borderRadius: '12px',
};

export const LOCALES = {
  PT_BR: 'pt-BR',
  EN: 'en',
};

export const DEFAULT_REPLAY_HOURS = 48;
export const DEFAULT_REMINDER_MINUTES = [1440, 60, 15]; // 24h, 1h, 15min
