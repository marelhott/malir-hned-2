import crypto from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import {
  AVAILABILITY_STATUSES,
  buildApproxLocation,
  CAPACITY_BLOCK_STATUSES,
  CAPACITY_BLOCK_TYPES,
  EVENT_TYPES,
  JOB_STATUSES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
  OFFER_STATUSES,
  sanitizeNote,
} from '../shared.js'
import {
  getAppBaseUrl,
  getOfferExpiryMinutes,
  getSupabaseStorageBucket,
  hasSupabaseConfig,
  isProduction,
} from './config.js'
import { DEFAULT_PAINTERS } from './painters.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../..')
const dataDir = path.join(rootDir, '.data')
const dataFile = path.join(dataDir, 'demo-store.json')

const DATE_FMT = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
const MONTH_FMT = new Intl.DateTimeFormat('cs-CZ', { month: 'long', year: 'numeric' })

const LEGACY_JOB_STATUS_MAP = {
  nova: JOB_STATUSES.NEW,
  ceka_na_kontrolu: JOB_STATUSES.WAITING_REVIEW,
  ceka_na_doplneni: JOB_STATUSES.WAITING_COMPLETION,
  pripravena_k_nabidnuti: JOB_STATUSES.READY_TO_OFFER,
  nabidnuto_maliri: JOB_STATUSES.OFFERED,
  malir_prijal: JOB_STATUSES.PAINTER_ACCEPTED,
  prirazena: JOB_STATUSES.ASSIGNED,
  potvrzena_klientovi: JOB_STATUSES.CLIENT_CONFIRMED,
  v_reseni: JOB_STATUSES.IN_PROGRESS,
  dokoncena: JOB_STATUSES.DONE,
  zrusena: JOB_STATUSES.CANCELED,
}

const LEGACY_OFFER_STATUS_MAP = {
  ceka_na_reakci: OFFER_STATUSES.PENDING,
  prijata: OFFER_STATUSES.ACCEPTED,
  odmitnuta: OFFER_STATUSES.DECLINED,
  prosla: OFFER_STATUSES.EXPIRED,
  stazena: OFFER_STATUSES.WITHDRAWN,
}

function nowIso() {
  return new Date().toISOString()
}

function todayIso() {
  return nowIso().slice(0, 10)
}

function createId() {
  return crypto.randomUUID()
}

function createReference() {
  return `MH-${Date.now().toString().slice(-7)}`
}

function randomToken() {
  return crypto.randomBytes(24).toString('base64url')
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function inferNotificationChannel(job) {
  return job.client_email ? NOTIFICATION_CHANNELS.EMAIL : NOTIFICATION_CHANNELS.SMS
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (!value) return []
  return [String(value)]
}

function buildJobFromPayload(payload) {
  const date = payload.booking?.preferredDate || payload.booking?.date || ''
  const dateLabel = payload.booking?.dateLabel || (date ? DATE_FMT.format(new Date(`${date}T12:00:00Z`)) : '')
  const sqm = Number(payload.booking?.squareMeters || payload.booking?.customArea || 0) || null

  return {
    id: createId(),
    reference: createReference(),
    public_token_hash: '',
    cancel_token_hash: '',
    public_token: null,
    cancel_token: null,
    status: JOB_STATUSES.WAITING_REVIEW,
    client_name: payload.customer?.name || '',
    client_phone: payload.customer?.phone || '',
    client_email: payload.customer?.email || '',
    address: payload.customer?.address || '',
    locality: buildApproxLocation(payload.customer?.address || ''),
    service_area: payload.customer?.city || buildApproxLocation(payload.customer?.address || ''),
    client_address: payload.customer?.address || '',
    client_note: payload.customer?.notes || '',
    notes: payload.customer?.notes || payload.booking?.notes || '',
    booking_note: payload.booking?.notes || '',
    preferred_date: date || '',
    preferred_date_label: dateLabel,
    preferred_time_label: payload.booking?.preferredTime || payload.booking?.slot || 'Preferovaný den',
    work_type: payload.booking?.workType || '',
    property_type: payload.booking?.propertyType || '',
    space_type: payload.booking?.propertyType || '',
    room_count: payload.booking?.roomCount ? Number(payload.booking.roomCount) : null,
    size_label: sqm ? `${sqm} m²` : '',
    square_meters: sqm,
    custom_area: sqm,
    area_mode: payload.booking?.areaMode || '',
    ceiling_height: payload.booking?.ceilingHeight || '',
    repairs: payload.booking?.repairs || '',
    material: payload.booking?.material || '',
    furniture_moving: payload.booking?.furnitureMoving || '',
    covering: payload.booking?.covering || '',
    cleaning: payload.booking?.cleaning || '',
    empty_space: payload.booking?.emptySpace || '',
    carpets: payload.booking?.carpets || '',
    approximate_location: buildApproxLocation(payload.customer?.address || ''),
    estimated_client_price_min: payload.booking?.priceLow || null,
    estimated_client_price_max: payload.booking?.priceHigh || null,
    estimated_price_low: payload.booking?.priceLow || null,
    estimated_price_high: payload.booking?.priceHigh || null,
    confirmed_client_price: null,
    confirmed_price: null,
    painter_reward: null,
    painter_payout: null,
    assigned_painter_id: null,
    selected_painter_id: null,
    selected_offer_id: null,
    selected_painter_name: null,
    needs_completion_reason: null,
    created_at: payload.submittedAt || nowIso(),
    updated_at: nowIso(),
    cancelled_at: null,
    completed_at: null,
    assigned_at: null,
  }
}

function decoratePublicJob(job, baseUrl) {
  const publicToken = randomToken()
  const cancelToken = randomToken()
  job.public_token_hash = hashToken(publicToken)
  job.cancel_token_hash = hashToken(cancelToken)
  job.public_token = publicToken
  job.cancel_token = cancelToken
  return {
    publicToken,
    cancelToken,
    publicUrl: `${baseUrl}/zakazka?token=${publicToken}`,
    cancelUrl: `${baseUrl}/zakazka?token=${publicToken}&mode=cancel&cancelToken=${cancelToken}`,
  }
}

function createEvent({ jobId, offerId = null, actorType, actorId = null, actorLabel, eventType, payload = {} }) {
  return {
    id: createId(),
    job_id: jobId,
    offer_id: offerId,
    actor_type: actorType,
    actor_id: actorId,
    actor_label: actorLabel,
    event_type: eventType,
    payload,
    created_at: nowIso(),
  }
}

function createNotification({ job, recipientType, recipientId = null, channel, templateKey, recipient, payload = {} }) {
  return {
    id: createId(),
    job_id: job.id,
    recipient_type: recipientType,
    recipient_id: recipientId,
    recipient,
    channel,
    template_key: templateKey,
    payload,
    status: NOTIFICATION_STATUSES.PENDING,
    sent_at: null,
    created_at: nowIso(),
  }
}

function createCapacityBlock({ painterId, jobId, date, blockType, expiresAt = null }) {
  return {
    id: createId(),
    painter_id: painterId,
    job_id: jobId,
    date,
    block_type: blockType,
    status: CAPACITY_BLOCK_STATUSES.ACTIVE,
    expires_at: expiresAt,
    created_at: nowIso(),
    updated_at: nowIso(),
  }
}

function formatMonthLabel(year, month) {
  return MONTH_FMT.format(new Date(Date.UTC(year, month - 1, 1)))
}

function weekdayLeading(year, month) {
  const day = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  return (day + 6) % 7
}

function buildMonthBuckets(fromDate, totalDays) {
  const months = []
  const map = new Map()
  for (let offset = 0; offset < totalDays; offset += 1) {
    const date = addDays(fromDate, offset)
    const d = new Date(`${date}T12:00:00Z`)
    const year = d.getUTCFullYear()
    const month = d.getUTCMonth() + 1
    const key = `${year}-${month}`
    if (!map.has(key)) {
      const entry = {
        key,
        label: formatMonthLabel(year, month),
        year,
        month,
        leading: weekdayLeading(year, month),
        days: new Date(Date.UTC(year, month, 0)).getUTCDate(),
        cal: [],
      }
      map.set(key, entry)
      months.push(entry)
    }
  }
  return months
}

function normalizePainter(painter) {
  const next = { ...painter }
  next.service_areas = normalizeList(next.service_areas || next.approx_location || 'Praha')
  next.work_types = normalizeList(next.work_types || next.specialties || ['Běžná bílá výmalba'])
  next.reliability_score = Number(next.reliability_score || 4.5)
  next.is_express_enabled = Boolean(next.is_express_enabled)
  next.notes = next.notes || ''
  if (!next.portal_access_token) {
    next.portal_access_token = randomToken()
    next.portal_token_hash = hashToken(next.portal_access_token)
  } else if (!next.portal_token_hash) {
    next.portal_token_hash = hashToken(next.portal_access_token)
  }
  next.created_at = next.created_at || nowIso()
  next.updated_at = nowIso()
  return next
}

function seedAvailabilityRow(painter, date) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay()
  let status = AVAILABILITY_STATUSES.AVAILABLE
  let capacity = 1
  if (day === 6) {
    status = AVAILABILITY_STATUSES.LIMITED
    capacity = 1
  }
  if (day === 0) {
    status = AVAILABILITY_STATUSES.UNAVAILABLE
    capacity = 0
  }
  return {
    id: createId(),
    painter_id: painter.id,
    date,
    status,
    capacity,
    accepts_express: Boolean(painter.is_express_enabled),
    note: '',
    source: 'system',
    created_at: nowIso(),
    updated_at: nowIso(),
  }
}

function ensureDefaultAvailability(state, days = 90) {
  const start = todayIso()
  for (const painter of state.painters) {
    for (let offset = 0; offset < days; offset += 1) {
      const date = addDays(start, offset)
      const exists = state.painter_availability.some((row) => row.painter_id === painter.id && row.date === date)
      if (!exists) {
        state.painter_availability.push(seedAvailabilityRow(painter, date))
      }
    }
  }
}

function normalizeState(state) {
  const defaultPaintersByName = new Map(DEFAULT_PAINTERS.map((painter) => [painter.name, painter]))
  state.jobs = Array.isArray(state.jobs) ? state.jobs : []
  state.job_photos = Array.isArray(state.job_photos) ? state.job_photos : []
  state.painters = (Array.isArray(state.painters) ? state.painters : DEFAULT_PAINTERS).map((item) =>
    normalizePainter({ ...(defaultPaintersByName.get(item.name) || {}), id: item.id || createId(), ...item }),
  )
  state.painter_availability = Array.isArray(state.painter_availability) ? state.painter_availability : []
  state.painter_capacity_blocks = Array.isArray(state.painter_capacity_blocks) ? state.painter_capacity_blocks : []
  state.job_offers = Array.isArray(state.job_offers) ? state.job_offers : []
  state.job_events = Array.isArray(state.job_events) ? state.job_events : []
  state.notifications = Array.isArray(state.notifications) ? state.notifications : []
  state.admin_users = Array.isArray(state.admin_users) ? state.admin_users : []

  for (const job of state.jobs) {
    job.status = LEGACY_JOB_STATUS_MAP[job.status] || job.status || JOB_STATUSES.WAITING_REVIEW
    job.client_address = job.client_address || job.address || ''
    job.address = job.address || job.client_address || ''
    job.locality = job.locality || job.approximate_location || buildApproxLocation(job.address || '')
    job.service_area = job.service_area || job.locality
    job.preferred_date = job.preferred_date || ''
    job.space_type = job.space_type || job.property_type || ''
    job.square_meters = job.square_meters || job.custom_area || null
    job.size_label = job.size_label || (job.square_meters ? `${job.square_meters} m²` : '')
    job.estimated_client_price_min = job.estimated_client_price_min ?? job.estimated_price_low ?? null
    job.estimated_client_price_max = job.estimated_client_price_max ?? job.estimated_price_high ?? null
    job.confirmed_client_price = job.confirmed_client_price ?? job.confirmed_price ?? null
    job.painter_reward = job.painter_reward ?? job.painter_payout ?? null
    job.assigned_painter_id = job.assigned_painter_id || job.selected_painter_id || null
    job.updated_at = job.updated_at || job.created_at || nowIso()
  }

  for (const offer of state.job_offers) {
    offer.status = LEGACY_OFFER_STATUS_MAP[offer.status] || offer.status || OFFER_STATUSES.PENDING
    offer.accepted_at = offer.accepted_at || (offer.status === OFFER_STATUSES.ACCEPTED ? offer.responded_at || nowIso() : null)
    offer.declined_at = offer.declined_at || (offer.status === OFFER_STATUSES.DECLINED ? offer.responded_at || nowIso() : null)
    offer.withdrawn_at = offer.withdrawn_at || (offer.status === OFFER_STATUSES.WITHDRAWN ? offer.updated_at || nowIso() : null)
    offer.offer_token = offer.offer_token || null
  }

  ensureDefaultAvailability(state)
  return state
}

function matchesArea(painter, locality) {
  if (!locality) return true
  const needle = locality.toLowerCase()
  return painter.service_areas.some((area) => String(area).toLowerCase().includes(needle) || needle.includes(String(area).toLowerCase()))
}

function matchesWorkType(painter, workType) {
  if (!workType) return true
  const needle = workType.toLowerCase()
  return painter.work_types.some((type) => String(type).toLowerCase().includes(needle) || needle.includes(String(type).toLowerCase()))
}

function getAvailabilityForDate(state, painterId, date) {
  return state.painter_availability.find((row) => row.painter_id === painterId && row.date === date) || null
}

function getActiveBlocksForDate(state, painterId, date) {
  return state.painter_capacity_blocks.filter((row) => row.painter_id === painterId && row.date === date && row.status === CAPACITY_BLOCK_STATUSES.ACTIVE)
}

function getRemainingCapacity(state, painter, date) {
  const availability = getAvailabilityForDate(state, painter.id, date)
  const baseCapacity = Number(availability?.capacity ?? 1)
  const activeBlocks = getActiveBlocksForDate(state, painter.id, date).filter((row) => row.block_type === CAPACITY_BLOCK_TYPES.CONFIRMED_ASSIGNMENT)
  return Math.max(0, baseCapacity - activeBlocks.length)
}

function buildSuggestedPainter(state, job, painter) {
  const availability = getAvailabilityForDate(state, painter.id, job.preferred_date)
  const remainingCapacity = getRemainingCapacity(state, painter, job.preferred_date)
  const activeBlocks = getActiveBlocksForDate(state, painter.id, job.preferred_date)
  const hasConfirmedBlock = activeBlocks.some((row) => row.block_type === CAPACITY_BLOCK_TYPES.CONFIRMED_ASSIGNMENT)
  const localityMatch = matchesArea(painter, job.locality || job.service_area)
  const workTypeMatch = matchesWorkType(painter, job.work_type)
  const expressMatch = !job.is_express || painter.is_express_enabled
  const status = availability?.status || AVAILABILITY_STATUSES.UNAVAILABLE
  let score = 0

  if (!painter.is_active) score -= 100
  if (status === AVAILABILITY_STATUSES.AVAILABLE) score += 6
  if (status === AVAILABILITY_STATUSES.LIMITED) score += 3
  if (status === AVAILABILITY_STATUSES.UNAVAILABLE) score -= 10
  if (localityMatch) score += 3
  if (workTypeMatch) score += 3
  if (expressMatch) score += 1
  if (remainingCapacity > 0) score += 2
  if (hasConfirmedBlock || remainingCapacity <= 0) score -= 20
  score += Number(painter.reliability_score || 0)

  return {
    ...painter,
    availability_status: status,
    accepts_express: Boolean(availability?.accepts_express ?? painter.is_express_enabled),
    availability_note: availability?.note || '',
    remaining_capacity: remainingCapacity,
    has_confirmed_block: hasConfirmedBlock,
    locality_match: localityMatch,
    work_type_match: workTypeMatch,
    express_match: expressMatch,
    score,
    display_status:
      !painter.is_active ? 'Neaktivní' :
      hasConfirmedBlock || remainingCapacity <= 0 ? 'Nedostupný' :
      status === AVAILABILITY_STATUSES.AVAILABLE ? `Dostupný ${job.preferred_date_label || job.preferred_date}` :
      status === AVAILABILITY_STATUSES.LIMITED ? 'Omezeně dostupný' :
      'Nedostupný',
  }
}

function buildPublicCalendar(state, options = {}) {
  const from = options.from || todayIso()
  const days = Math.min(Number(options.days) || 90, 120)
  const months = buildMonthBuckets(from, days)
  const monthMap = new Map(months.map((month) => [month.key, month]))

  for (let offset = 0; offset < days; offset += 1) {
    const date = addDays(from, offset)
    const d = new Date(`${date}T12:00:00Z`)
    const monthKey = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`
    const month = monthMap.get(monthKey)
    const suitablePainters = state.painters.filter((painter) => {
      if (!painter.is_active) return false
      if (options.locality && !matchesArea(painter, options.locality)) return false
      if (options.workType && !matchesWorkType(painter, options.workType)) return false
      const availability = getAvailabilityForDate(state, painter.id, date)
      if (!availability || availability.status === AVAILABILITY_STATUSES.UNAVAILABLE) return false
      if (options.express === 'true' && !(availability.accepts_express || painter.is_express_enabled)) return false
      return getRemainingCapacity(state, painter, date) > 0
    })

    let serviceStatus = 'plno'
    let label = 'Plno / nedostupné'
    if (suitablePainters.length >= 3) {
      serviceStatus = 'volno'
      label = 'Volno'
    } else if (suitablePainters.length === 2) {
      serviceStatus = 'omezena_kapacita'
      label = 'Omezená kapacita'
    } else if (suitablePainters.length === 1) {
      serviceStatus = 'posledni_misto'
      label = 'Poslední místo'
    }

    month.cal.push({
      d: d.getUTCDate(),
      date,
      service_status: serviceStatus,
      service_label: label,
      available_painters_count: suitablePainters.length,
      selectable: suitablePainters.length > 0,
    })
  }

  return months
}

function buildJobSummary(state, job) {
  const offers = state.job_offers.filter((offer) => offer.job_id === job.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const events = state.job_events.filter((event) => event.job_id === job.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const suggestedPainters = job.preferred_date
    ? state.painters
      .map((painter) => buildSuggestedPainter(state, job, painter))
      .sort((a, b) => b.score - a.score)
    : []

  return {
    ...job,
    waiting_label: job.created_at,
    last_activity_at: events[0]?.created_at || job.updated_at,
    last_offered_painter_name: offers[0]?.painter_name || null,
    suitable_painters_count: suggestedPainters.filter((painter) => painter.score > 0).length,
    best_painter_status: suggestedPainters[0]?.display_status || 'Bez doporučení',
  }
}

class JsonStateStore {
  async readRawState() {
    throw new Error('Not implemented')
  }

  async writeRawState(_state) {
    throw new Error('Not implemented')
  }

  async readState() {
    const rawState = await this.readRawState()
    const rawSerialized = JSON.stringify(rawState)
    const normalized = normalizeState(rawState)
    if (JSON.stringify(normalized) !== rawSerialized) {
      await this.writeRawState(normalized)
    }
    return normalized
  }

  async writeState(state) {
    return this.writeRawState(normalizeState(state))
  }

  async bootstrapAdminUser(email) {
    const state = await this.readState()
    const found = state.admin_users.find((item) => item.email === email)
    if (!found) {
      state.admin_users.push({
        id: createId(),
        email,
        name: 'Admin',
        role: 'owner',
        created_at: nowIso(),
        updated_at: nowIso(),
      })
      await this.writeState(state)
    }
  }

  async createJob(payload, req) {
    const state = await this.readState()
    const job = buildJobFromPayload(payload)
    const links = decoratePublicJob(job, getAppBaseUrl(req))
    state.jobs.unshift(job)
    state.job_events.push(
      createEvent({ jobId: job.id, actorType: 'client', actorLabel: job.client_name || 'Klient', eventType: EVENT_TYPES.JOB_CREATED, payload: { reference: job.reference } }),
      createEvent({ jobId: job.id, actorType: 'system', actorLabel: 'System', eventType: EVENT_TYPES.CLIENT_CONFIRMATION_QUEUED, payload: { channel: inferNotificationChannel(job) } }),
    )
    state.notifications.push(
      createNotification({
        job,
        recipientType: 'client',
        channel: inferNotificationChannel(job),
        recipient: job.client_email || job.client_phone,
        templateKey: 'job_received',
        payload: links,
      }),
    )
    await this.writeState(state)
    return { job, links }
  }

  async listJobs() {
    const state = await this.readState()
    return state.jobs.map((job) => buildJobSummary(state, job))
  }

  async getJob(jobId) {
    const state = await this.readState()
    const job = state.jobs.find((item) => item.id === jobId)
    if (!job) return null
    const recommendedPainters = job.preferred_date
      ? state.painters.map((painter) => buildSuggestedPainter(state, job, painter)).sort((a, b) => b.score - a.score)
      : []

    return {
      job: buildJobSummary(state, job),
      offers: state.job_offers.filter((offer) => offer.job_id === jobId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
      events: state.job_events.filter((event) => event.job_id === jobId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
      notifications: state.notifications.filter((item) => item.job_id === jobId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
      recommendedPainters,
      capacityBlocks: state.painter_capacity_blocks.filter((item) => item.job_id === jobId),
      photos: state.job_photos.filter((item) => item.job_id === jobId),
    }
  }

  async getPainters() {
    const state = await this.readState()
    return state.painters
      .filter((item) => item.is_active)
      .map((painter) => ({
        ...painter,
        portal_url: `/malir.html?token=${painter.portal_access_token}`,
      }))
  }

  async requestCompletion(jobId, adminEmail, reason) {
    const state = await this.readState()
    const job = state.jobs.find((item) => item.id === jobId)
    if (!job) throw new Error('Zakázka nebyla nalezena.')
    job.status = JOB_STATUSES.WAITING_COMPLETION
    job.needs_completion_reason = reason || 'Prosíme o doplnění údajů.'
    job.updated_at = nowIso()
    state.job_events.push(createEvent({ jobId, actorType: 'admin', actorLabel: adminEmail, eventType: EVENT_TYPES.COMPLETION_REQUESTED, payload: { reason: job.needs_completion_reason } }))
    state.notifications.push(
      createNotification({
        job,
        recipientType: 'client',
        channel: inferNotificationChannel(job),
        recipient: job.client_email || job.client_phone,
        templateKey: 'completion_requested',
        payload: { reason: job.needs_completion_reason },
      }),
    )
    await this.writeState(state)
    return job
  }

  async prepareJob(jobId, adminEmail, confirmedPrice, painterPayout) {
    const state = await this.readState()
    const job = state.jobs.find((item) => item.id === jobId)
    if (!job) throw new Error('Zakázka nebyla nalezena.')
    job.status = JOB_STATUSES.READY_TO_OFFER
    job.confirmed_client_price = Number(confirmedPrice) || null
    job.confirmed_price = job.confirmed_client_price
    job.painter_reward = Number(painterPayout) || null
    job.painter_payout = job.painter_reward
    job.updated_at = nowIso()
    state.job_events.push(
      createEvent({ jobId, actorType: 'admin', actorLabel: adminEmail, eventType: EVENT_TYPES.CLIENT_PRICE_SET, payload: { confirmedPrice: job.confirmed_client_price } }),
      createEvent({ jobId, actorType: 'admin', actorLabel: adminEmail, eventType: EVENT_TYPES.PAINTER_PAYOUT_SET, payload: { painterPayout: job.painter_reward } }),
    )
    await this.writeState(state)
    return job
  }

  async sendOffer(jobId, painterId, adminEmail, req) {
    const state = await this.readState()
    const job = state.jobs.find((item) => item.id === jobId)
    const painter = state.painters.find((item) => item.id === painterId)
    if (!job || !painter) throw new Error('Zakázka nebo malíř nebyl nalezen.')
    const token = randomToken()
    const expiresAt = new Date(Date.now() + getOfferExpiryMinutes() * 60000).toISOString()
    const offer = {
      id: createId(),
      job_id: jobId,
      painter_id: painterId,
      painter_name: painter.name,
      offer_token: token,
      token_hash: hashToken(token),
      status: OFFER_STATUSES.PENDING,
      offered_reward: job.painter_reward,
      offered_payout: job.painter_reward,
      approx_location: job.locality || job.approximate_location,
      sanitized_note: sanitizeNote(`${job.booking_note || ''}\n${job.client_note || job.notes || ''}`),
      expires_at: expiresAt,
      accepted_at: null,
      declined_at: null,
      withdrawn_at: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    }
    job.status = JOB_STATUSES.OFFERED
    job.updated_at = nowIso()
    state.job_offers.push(offer)
    state.job_events.push(createEvent({ jobId, offerId: offer.id, actorType: 'admin', actorLabel: adminEmail, eventType: EVENT_TYPES.OFFER_SENT, payload: { painterName: painter.name, expiresAt } }))
    state.notifications.push(
      createNotification({
        job,
        recipientType: 'painter',
        recipientId: painter.id,
        recipient: painter.email || painter.phone,
        channel: painter.email ? NOTIFICATION_CHANNELS.EMAIL : NOTIFICATION_CHANNELS.SMS,
        templateKey: 'painter_offer',
        payload: { offerUrl: `${getAppBaseUrl(req)}/nabidka?token=${token}` },
      }),
    )
    await this.writeState(state)
    return { job, offer, offerUrl: `${getAppBaseUrl(req)}/nabidka?token=${token}` }
  }

  async withdrawOffer(jobId, offerId, adminEmail) {
    const state = await this.readState()
    const offer = state.job_offers.find((item) => item.id === offerId && item.job_id === jobId)
    if (!offer) throw new Error('Nabídka nebyla nalezena.')
    if (offer.status !== OFFER_STATUSES.PENDING) throw new Error('Aktivní nabídku už nelze stáhnout.')
    offer.status = OFFER_STATUSES.WITHDRAWN
    offer.withdrawn_at = nowIso()
    offer.updated_at = nowIso()
    state.job_events.push(createEvent({ jobId, offerId, actorType: 'admin', actorLabel: adminEmail, eventType: EVENT_TYPES.OFFER_WITHDRAWN }))
    await this.writeState(state)
    return offer
  }

  async getOfferByToken(token) {
    const state = await this.readState()
    const offer = state.job_offers.find((item) => item.token_hash === hashToken(token))
    if (!offer) return null
    const job = state.jobs.find((item) => item.id === offer.job_id)
    const painter = state.painters.find((item) => item.id === offer.painter_id)
    if (!job || !painter) return null

    const safeJob = {
      ...job,
      client_name: job.status === JOB_STATUSES.CLIENT_CONFIRMED && job.selected_offer_id === offer.id ? job.client_name : '',
      client_phone: job.status === JOB_STATUSES.CLIENT_CONFIRMED && job.selected_offer_id === offer.id ? job.client_phone : '',
      client_email: job.status === JOB_STATUSES.CLIENT_CONFIRMED && job.selected_offer_id === offer.id ? job.client_email : '',
      address: job.status === JOB_STATUSES.CLIENT_CONFIRMED && job.selected_offer_id === offer.id ? job.address : '',
      client_address: job.status === JOB_STATUSES.CLIENT_CONFIRMED && job.selected_offer_id === offer.id ? job.client_address : '',
    }

    return { offer, job: safeJob, painter }
  }

  async respondToOffer(token, decision) {
    const state = await this.readState()
    const offer = state.job_offers.find((item) => item.token_hash === hashToken(token))
    if (!offer) throw new Error('Tato nabídka už není dostupná.')
    const job = state.jobs.find((item) => item.id === offer.job_id)
    if (!job) throw new Error('Zakázka nebyla nalezena.')
    if (offer.status !== OFFER_STATUSES.PENDING) throw new Error('Tato nabídka už není dostupná.')
    if (new Date(offer.expires_at).getTime() < Date.now()) {
      offer.status = OFFER_STATUSES.EXPIRED
      offer.updated_at = nowIso()
      state.job_events.push(createEvent({ jobId: job.id, offerId: offer.id, actorType: 'system', actorLabel: 'System', eventType: EVENT_TYPES.OFFER_EXPIRED }))
      await this.writeState(state)
      throw new Error('Tato nabídka už není dostupná.')
    }
    if (state.job_offers.some((item) => item.job_id === job.id && item.status === OFFER_STATUSES.ACCEPTED && item.id !== offer.id)) {
      throw new Error('Tato nabídka už není dostupná.')
    }

    if (decision === 'accept') {
      offer.status = OFFER_STATUSES.ACCEPTED
      offer.accepted_at = nowIso()
      offer.updated_at = nowIso()
      job.status = JOB_STATUSES.PAINTER_ACCEPTED
      job.selected_offer_id = offer.id
      job.selected_painter_id = offer.painter_id
      job.selected_painter_name = offer.painter_name
      job.assigned_painter_id = offer.painter_id
      job.updated_at = nowIso()
      if (job.preferred_date) {
        state.painter_capacity_blocks.push(
          createCapacityBlock({
            painterId: offer.painter_id,
            jobId: job.id,
            date: job.preferred_date,
            blockType: CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD,
            expiresAt: offer.expires_at,
          }),
        )
        state.job_events.push(createEvent({ jobId: job.id, offerId: offer.id, actorType: 'system', actorLabel: 'System', eventType: EVENT_TYPES.CAPACITY_BLOCK_CREATED, payload: { blockType: CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD, date: job.preferred_date } }))
      }
      state.job_events.push(createEvent({ jobId: job.id, offerId: offer.id, actorType: 'painter', actorId: offer.painter_id, actorLabel: offer.painter_name, eventType: EVENT_TYPES.OFFER_ACCEPTED }))
    } else {
      offer.status = OFFER_STATUSES.DECLINED
      offer.declined_at = nowIso()
      offer.updated_at = nowIso()
      job.status = JOB_STATUSES.READY_TO_OFFER
      job.updated_at = nowIso()
      state.job_events.push(createEvent({ jobId: job.id, offerId: offer.id, actorType: 'painter', actorId: offer.painter_id, actorLabel: offer.painter_name, eventType: EVENT_TYPES.OFFER_DECLINED }))
    }
    await this.writeState(state)
    return { offer, job }
  }

  async confirmAssignment(jobId, adminEmail) {
    const state = await this.readState()
    const job = state.jobs.find((item) => item.id === jobId)
    if (!job || !job.selected_offer_id) throw new Error('Zakázka nemá přijatou nabídku.')
    const winningOffer = state.job_offers.find((item) => item.id === job.selected_offer_id)
    if (!winningOffer || winningOffer.status !== OFFER_STATUSES.ACCEPTED) throw new Error('Přijatá nabídka už není dostupná.')

    for (const offer of state.job_offers.filter((item) => item.job_id === jobId && item.id !== winningOffer.id && item.status === OFFER_STATUSES.PENDING)) {
      offer.status = OFFER_STATUSES.WITHDRAWN
      offer.withdrawn_at = nowIso()
      offer.updated_at = nowIso()
      state.job_events.push(createEvent({ jobId, offerId: offer.id, actorType: 'system', actorLabel: 'System', eventType: EVENT_TYPES.OFFER_WITHDRAWN }))
    }

    for (const block of state.painter_capacity_blocks.filter((item) => item.job_id === jobId && item.status === CAPACITY_BLOCK_STATUSES.ACTIVE && item.block_type === CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD)) {
      block.status = CAPACITY_BLOCK_STATUSES.RELEASED
      block.updated_at = nowIso()
      state.job_events.push(createEvent({ jobId, actorType: 'system', actorLabel: 'System', eventType: EVENT_TYPES.CAPACITY_BLOCK_RELEASED, payload: { blockType: block.block_type, date: block.date } }))
    }

    if (job.preferred_date && job.selected_painter_id) {
      state.painter_capacity_blocks.push(createCapacityBlock({
        painterId: job.selected_painter_id,
        jobId,
        date: job.preferred_date,
        blockType: CAPACITY_BLOCK_TYPES.CONFIRMED_ASSIGNMENT,
      }))
      state.job_events.push(createEvent({ jobId, offerId: winningOffer.id, actorType: 'system', actorLabel: 'System', eventType: EVENT_TYPES.CAPACITY_BLOCK_CREATED, payload: { blockType: CAPACITY_BLOCK_TYPES.CONFIRMED_ASSIGNMENT, date: job.preferred_date } }))
    }

    job.status = JOB_STATUSES.CLIENT_CONFIRMED
    job.assigned_at = nowIso()
    job.updated_at = nowIso()
    state.job_events.push(
      createEvent({ jobId, offerId: winningOffer.id, actorType: 'admin', actorLabel: adminEmail, eventType: EVENT_TYPES.JOB_ASSIGNED, payload: { painterName: winningOffer.painter_name } }),
      createEvent({ jobId, offerId: winningOffer.id, actorType: 'system', actorLabel: 'System', eventType: EVENT_TYPES.CLIENT_ASSIGNED_NOTIFICATION_QUEUED }),
      createEvent({ jobId, offerId: winningOffer.id, actorType: 'system', actorLabel: 'System', eventType: EVENT_TYPES.PAINTER_CONTACT_UNLOCKED }),
    )
    state.notifications.push(
      createNotification({
        job,
        recipientType: 'client',
        channel: inferNotificationChannel(job),
        recipient: job.client_email || job.client_phone,
        templateKey: 'job_assigned',
        payload: { painterName: winningOffer.painter_name },
      }),
      createNotification({
        job,
        recipientType: 'painter',
        recipientId: winningOffer.painter_id,
        recipient: winningOffer.painter_name,
        channel: NOTIFICATION_CHANNELS.EMAIL,
        templateKey: 'painter_contact_unlocked',
        payload: { clientName: job.client_name, clientPhone: job.client_phone, clientAddress: job.address },
      }),
    )
    await this.writeState(state)
    return job
  }

  async returnToDispatch(jobId, adminEmail) {
    const state = await this.readState()
    const job = state.jobs.find((item) => item.id === jobId)
    if (!job) throw new Error('Zakázka nebyla nalezena.')
    job.status = JOB_STATUSES.READY_TO_OFFER
    job.selected_offer_id = null
    job.selected_painter_id = null
    job.selected_painter_name = null
    job.assigned_painter_id = null
    job.updated_at = nowIso()
    for (const block of state.painter_capacity_blocks.filter((item) => item.job_id === jobId && item.status === CAPACITY_BLOCK_STATUSES.ACTIVE)) {
      block.status = CAPACITY_BLOCK_STATUSES.RELEASED
      block.updated_at = nowIso()
    }
    state.job_events.push(createEvent({ jobId, actorType: 'admin', actorLabel: adminEmail, eventType: EVENT_TYPES.JOB_RETURNED_TO_DISPATCH }))
    await this.writeState(state)
    return job
  }

  async markJobState(jobId, adminEmail, nextStatus) {
    const state = await this.readState()
    const job = state.jobs.find((item) => item.id === jobId)
    if (!job) throw new Error('Zakázka nebyla nalezena.')
    job.status = nextStatus
    job.updated_at = nowIso()
    if (nextStatus === JOB_STATUSES.DONE) job.completed_at = nowIso()
    const eventType = nextStatus === JOB_STATUSES.IN_PROGRESS ? EVENT_TYPES.JOB_MARKED_IN_PROGRESS : nextStatus === JOB_STATUSES.DONE ? EVENT_TYPES.JOB_COMPLETED : EVENT_TYPES.JOB_REVIEWED
    state.job_events.push(createEvent({ jobId, actorType: 'admin', actorLabel: adminEmail, eventType }))
    await this.writeState(state)
    return job
  }

  async cancelAdminJob(jobId, adminEmail) {
    const state = await this.readState()
    const job = state.jobs.find((item) => item.id === jobId)
    if (!job) throw new Error('Zakázka nebyla nalezena.')
    job.status = JOB_STATUSES.CANCELED
    job.updated_at = nowIso()
    job.cancelled_at = nowIso()
    for (const offer of state.job_offers.filter((item) => item.job_id === jobId && item.status === OFFER_STATUSES.PENDING)) {
      offer.status = OFFER_STATUSES.WITHDRAWN
      offer.withdrawn_at = nowIso()
      offer.updated_at = nowIso()
    }
    for (const block of state.painter_capacity_blocks.filter((item) => item.job_id === jobId && item.status === CAPACITY_BLOCK_STATUSES.ACTIVE)) {
      block.status = CAPACITY_BLOCK_STATUSES.RELEASED
      block.updated_at = nowIso()
    }
    state.job_events.push(createEvent({ jobId, actorType: 'admin', actorLabel: adminEmail, eventType: EVENT_TYPES.JOB_CANCELED }))
    await this.writeState(state)
    return job
  }

  async getPublicJob(token) {
    const state = await this.readState()
    const job = state.jobs.find((item) => item.public_token_hash === hashToken(token))
    if (!job) return null
    return {
      job,
      events: state.job_events.filter((event) => event.job_id === job.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
      offers: state.job_offers.filter((offer) => offer.job_id === job.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    }
  }

  async completePublicJob(token, patch) {
    const state = await this.readState()
    const job = state.jobs.find((item) => item.public_token_hash === hashToken(token))
    if (!job) throw new Error('Zakázka nebyla nalezena.')
    job.client_name = patch.name || job.client_name
    job.client_phone = patch.phone || job.client_phone
    job.client_email = patch.email || job.client_email
    job.client_address = patch.address || job.client_address
    job.address = patch.address || job.address
    job.locality = buildApproxLocation(job.address)
    job.client_note = patch.notes || job.client_note
    job.notes = patch.notes || job.notes
    job.status = JOB_STATUSES.WAITING_REVIEW
    job.updated_at = nowIso()
    state.job_events.push(createEvent({ jobId: job.id, actorType: 'client', actorLabel: job.client_name || 'Klient', eventType: EVENT_TYPES.CLIENT_COMPLETED }))
    await this.writeState(state)
    return job
  }

  async cancelPublicJob(cancelToken) {
    const state = await this.readState()
    const job = state.jobs.find((item) => item.cancel_token_hash === hashToken(cancelToken))
    if (!job) throw new Error('Zakázka nebyla nalezena.')
    job.status = JOB_STATUSES.CANCELED
    job.updated_at = nowIso()
    job.cancelled_at = nowIso()
    for (const block of state.painter_capacity_blocks.filter((item) => item.job_id === job.id && item.status === CAPACITY_BLOCK_STATUSES.ACTIVE)) {
      block.status = CAPACITY_BLOCK_STATUSES.RELEASED
      block.updated_at = nowIso()
    }
    state.job_events.push(createEvent({ jobId: job.id, actorType: 'client', actorLabel: job.client_name || 'Klient', eventType: EVENT_TYPES.JOB_CANCELED }))
    await this.writeState(state)
    return job
  }

  async getPublicAvailabilityCalendar(options = {}) {
    const state = await this.readState()
    return { months: buildPublicCalendar(state, options) }
  }

  async getPainterPortal(token) {
    const state = await this.readState()
    const painter = state.painters.find((item) => item.portal_token_hash === hashToken(token))
    if (!painter) return null
    const today = todayIso()
    const availability = state.painter_availability
      .filter((row) => row.painter_id === painter.id && row.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 30)
    const offers = state.job_offers
      .filter((row) => row.painter_id === painter.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 12)
      .map((offer) => ({
        ...offer,
        job: state.jobs.find((job) => job.id === offer.job_id) || null,
      }))
    return { painter, availability, offers }
  }

  async updatePainterAvailability(token, payload) {
    const state = await this.readState()
    const painter = state.painters.find((item) => item.portal_token_hash === hashToken(token))
    if (!painter) throw new Error('Malíř nebyl nalezen.')
    if (typeof payload?.painterNote === 'string') {
      painter.notes = payload.painterNote
      painter.updated_at = nowIso()
    }
    const safeEntries = Array.isArray(payload?.entries) ? payload.entries : []
    for (const entry of safeEntries) {
      if (!entry?.date) continue
      const existing = state.painter_availability.find((row) => row.painter_id === painter.id && row.date === entry.date)
      const next = {
        status: entry.status || AVAILABILITY_STATUSES.AVAILABLE,
        capacity: Number(entry.capacity) >= 0 ? Number(entry.capacity) : 1,
        accepts_express: Boolean(entry.accepts_express),
        note: entry.note || '',
        source: entry.source || 'painter',
      }
      if (existing) {
        Object.assign(existing, next, { updated_at: nowIso() })
      } else {
        state.painter_availability.push({
          id: createId(),
          painter_id: painter.id,
          date: entry.date,
          ...next,
          created_at: nowIso(),
          updated_at: nowIso(),
        })
      }
      state.job_events.push(createEvent({ jobId: null, actorType: 'painter', actorId: painter.id, actorLabel: painter.name, eventType: EVENT_TYPES.PAINTER_AVAILABILITY_UPDATED, payload: { date: entry.date, status: next.status } }))
    }
    await this.writeState(state)
    return this.getPainterPortal(token)
  }
}

async function ensureDemoStore() {
  await mkdir(dataDir, { recursive: true })
  try {
    await readFile(dataFile, 'utf8')
  } catch {
    await writeFile(
      dataFile,
      JSON.stringify({
        jobs: [],
        job_photos: [],
        painters: DEFAULT_PAINTERS.map((painter) => normalizePainter({ id: createId(), ...painter })),
        painter_availability: [],
        painter_capacity_blocks: [],
        job_offers: [],
        job_events: [],
        notifications: [],
        admin_users: [],
      }, null, 2),
      'utf8',
    )
  }
}

class DemoStore extends JsonStateStore {
  async readRawState() {
    await ensureDemoStore()
    return JSON.parse(await readFile(dataFile, 'utf8'))
  }

  async writeRawState(state) {
    await mkdir(dataDir, { recursive: true })
    await writeFile(dataFile, JSON.stringify(state, null, 2), 'utf8')
  }
}

class SupabaseStorageStore extends JsonStateStore {
  constructor() {
    super()
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
    this.client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    this.bucket = getSupabaseStorageBucket()
    this.objectPath = 'state.json'
  }

  async ensureBucket() {
    const { data: buckets } = await this.client.storage.listBuckets()
    if (!(buckets || []).some((item) => item.name === this.bucket)) {
      const { error } = await this.client.storage.createBucket(this.bucket, { public: false })
      if (error && !String(error.message || '').includes('already exists')) throw error
    }
  }

  async readRawState() {
    await this.ensureBucket()
    const { data, error } = await this.client.storage.from(this.bucket).download(this.objectPath)
    if (error) {
      if (String(error.message || '').toLowerCase().includes('not found')) {
        const initial = {
          jobs: [],
          job_photos: [],
          painters: DEFAULT_PAINTERS.map((painter) => normalizePainter({ id: createId(), ...painter })),
          painter_availability: [],
          painter_capacity_blocks: [],
          job_offers: [],
          job_events: [],
          notifications: [],
          admin_users: [],
        }
        await this.writeRawState(initial)
        return initial
      }
      throw error
    }
    return JSON.parse(await data.text())
  }

  async writeRawState(state) {
    await this.ensureBucket()
    const payload = JSON.stringify(state, null, 2)
    const { error } = await this.client.storage.from(this.bucket).upload(
      this.objectPath,
      new Blob([payload], { type: 'application/json' }),
      { upsert: true, contentType: 'application/json' },
    )
    if (error) throw error
  }
}

class DisabledStore {
  error() {
    throw new Error('Produkční backend ještě není nakonfigurovaný. Doplňte prosím SUPABASE_URL a SUPABASE_SERVICE_ROLE_KEY.')
  }

  async bootstrapAdminUser() { this.error() }
  async createJob() { this.error() }
  async listJobs() { this.error() }
  async getJob() { this.error() }
  async getPainters() { this.error() }
  async requestCompletion() { this.error() }
  async prepareJob() { this.error() }
  async sendOffer() { this.error() }
  async withdrawOffer() { this.error() }
  async getOfferByToken() { this.error() }
  async respondToOffer() { this.error() }
  async confirmAssignment() { this.error() }
  async returnToDispatch() { this.error() }
  async markJobState() { this.error() }
  async cancelAdminJob() { this.error() }
  async getPublicJob() { this.error() }
  async completePublicJob() { this.error() }
  async cancelPublicJob() { this.error() }
  async getPublicAvailabilityCalendar() { this.error() }
  async getPainterPortal() { this.error() }
  async updatePainterAvailability() { this.error() }
}

let cachedStore = null

export function getStore() {
  if (cachedStore) return cachedStore
  if (hasSupabaseConfig()) {
    cachedStore = new SupabaseStorageStore()
    return cachedStore
  }
  cachedStore = isProduction() ? new DisabledStore() : new DemoStore()
  return cachedStore
}
