export const JOB_STATUSES = {
  NEW: 'nova',
  WAITING_REVIEW: 'ceka_na_kontrolu',
  WAITING_COMPLETION: 'ceka_na_doplneni',
  READY_TO_OFFER: 'pripravena_k_nabidnuti',
  OFFERED: 'nabidnuto_maliri',
  PAINTER_ACCEPTED: 'malir_prijal',
  ASSIGNED: 'prirazena',
  CLIENT_CONFIRMED: 'potvrzena_klientovi',
  IN_PROGRESS: 'v_reseni',
  DONE: 'dokoncena',
  CANCELED: 'zrusena',
}

export const OFFER_STATUSES = {
  PENDING: 'ceka_na_reakci',
  ACCEPTED: 'prijata',
  DECLINED: 'odmitnuta',
  EXPIRED: 'prosla',
  WITHDRAWN: 'stazena',
}

export const EVENT_TYPES = {
  JOB_CREATED: 'job_created',
  CLIENT_CONFIRMATION_QUEUED: 'client_confirmation_queued',
  JOB_REVIEWED: 'job_reviewed',
  COMPLETION_REQUESTED: 'completion_requested',
  CLIENT_COMPLETED: 'client_completed',
  CLIENT_PRICE_SET: 'client_price_set',
  PAINTER_PAYOUT_SET: 'painter_payout_set',
  OFFER_SENT: 'offer_sent',
  OFFER_ACCEPTED: 'offer_accepted',
  OFFER_DECLINED: 'offer_declined',
  OFFER_EXPIRED: 'offer_expired',
  OFFER_WITHDRAWN: 'offer_withdrawn',
  JOB_ASSIGNED: 'job_assigned',
  CLIENT_ASSIGNED_NOTIFICATION_QUEUED: 'client_assigned_notification_queued',
  PAINTER_CONTACT_UNLOCKED: 'painter_contact_unlocked',
  JOB_RETURNED_TO_DISPATCH: 'job_returned_to_dispatch',
  JOB_CANCELED: 'job_canceled',
  JOB_MARKED_IN_PROGRESS: 'job_marked_in_progress',
  JOB_COMPLETED: 'job_completed',
}

export const NOTIFICATION_STATUSES = {
  PENDING: 'pending',
  SENT: 'sent',
  SKIPPED: 'skipped',
  FAILED: 'failed',
}

export const NOTIFICATION_CHANNELS = {
  EMAIL: 'email',
  SMS: 'sms',
}

export function formatMoney(value) {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('cs-CZ').format(value)
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function buildApproxLocation(address = '') {
  const parts = String(address)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  if (!parts.length) return 'Lokalita bude doplněna'

  const cityMatch = parts.find((part) => /praha|kladno|beroun|kolin|mlada|stredoc/i.test(part))
  if (cityMatch) return cityMatch

  return parts.slice(-2).join(', ')
}

export function normalizePhone(phone = '') {
  return String(phone).replace(/[^\d+]/g, '').trim()
}

export function sanitizeNote(note = '') {
  return String(note)
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email skryt]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[telefon skryt]')
    .trim()
}

export function humanizeWaiting(createdAt) {
  const elapsedMs = Date.now() - new Date(createdAt).getTime()
  const minutes = Math.max(0, Math.round(elapsedMs / 60000))
  if (minutes < 1) return 'právě teď'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}
