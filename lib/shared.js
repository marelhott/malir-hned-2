export const JOB_STATUSES = {
  NEW: 'new',
  WAITING_REVIEW: 'waiting_for_review',
  WAITING_COMPLETION: 'waiting_for_client_details',
  READY_TO_OFFER: 'ready_to_offer',
  OFFERED: 'offered_to_painter',
  PAINTER_ACCEPTED: 'painter_accepted',
  ASSIGNED: 'assigned',
  CLIENT_CONFIRMED: 'confirmed_to_client',
  IN_PROGRESS: 'in_progress',
  DONE: 'completed',
  CANCELED: 'cancelled',
}

export const OFFER_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
  WITHDRAWN: 'withdrawn',
}

export const AVAILABILITY_STATUSES = {
  AVAILABLE: 'available',
  LIMITED: 'limited',
  UNAVAILABLE: 'unavailable',
}

export const CAPACITY_BLOCK_TYPES = {
  TEMPORARY_HOLD: 'temporary_hold',
  CONFIRMED_ASSIGNMENT: 'confirmed_assignment',
}

export const CAPACITY_BLOCK_STATUSES = {
  ACTIVE: 'active',
  RELEASED: 'released',
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
  PAINTER_AVAILABILITY_UPDATED: 'painter_availability_updated',
  CAPACITY_BLOCK_CREATED: 'capacity_block_created',
  CAPACITY_BLOCK_RELEASED: 'capacity_block_released',
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

export function humanizeJobStatus(status) {
  const labels = {
    [JOB_STATUSES.NEW]: 'Nová',
    [JOB_STATUSES.WAITING_REVIEW]: 'Čeká na kontrolu',
    [JOB_STATUSES.WAITING_COMPLETION]: 'Čeká na doplnění',
    [JOB_STATUSES.READY_TO_OFFER]: 'Připravená k nabídnutí',
    [JOB_STATUSES.OFFERED]: 'Nabídnuto malíři',
    [JOB_STATUSES.PAINTER_ACCEPTED]: 'Malíř přijal',
    [JOB_STATUSES.ASSIGNED]: 'Přiřazeno',
    [JOB_STATUSES.CLIENT_CONFIRMED]: 'Potvrzeno klientovi',
    [JOB_STATUSES.IN_PROGRESS]: 'V řešení',
    [JOB_STATUSES.DONE]: 'Dokončeno',
    [JOB_STATUSES.CANCELED]: 'Zrušeno',
  }

  return labels[status] || status || '—'
}

export function humanizeOfferStatus(status) {
  const labels = {
    [OFFER_STATUSES.PENDING]: 'Čeká na reakci',
    [OFFER_STATUSES.ACCEPTED]: 'Přijatá',
    [OFFER_STATUSES.DECLINED]: 'Odmítnutá',
    [OFFER_STATUSES.EXPIRED]: 'Prošlá',
    [OFFER_STATUSES.WITHDRAWN]: 'Stažená',
  }

  return labels[status] || status || '—'
}

export function humanizeAvailabilityStatus(status) {
  const labels = {
    [AVAILABILITY_STATUSES.AVAILABLE]: 'Dostupný',
    [AVAILABILITY_STATUSES.LIMITED]: 'Omezeně dostupný',
    [AVAILABILITY_STATUSES.UNAVAILABLE]: 'Nedostupný',
  }

  return labels[status] || status || '—'
}
