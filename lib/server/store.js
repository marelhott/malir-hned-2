import crypto from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import {
  sendJobReceived,
  sendAdminNewJob,
  sendPainterOffer,
  sendJobAssigned,
  sendPainterContactUnlocked,
  sendPainterJobCancelled,
} from './email.js'
import { sendPushToAll } from './push.js'
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
  getSupabaseStoreMode,
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

function randomSessionVersion() {
  return `sv_${crypto.randomBytes(18).toString('base64url')}`
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function deriveDefaultPainterPin(painter) {
  const digits = String(painter?.phone || '').replace(/\D+/g, '')
  if (digits.length >= 6) return digits.slice(-6)
  return '123456'
}

function hashPainterPin(pin, salt = crypto.randomBytes(16).toString('hex')) {
  const digest = crypto.scryptSync(String(pin), salt, 32).toString('hex')
  return `pin$${salt}$${digest}`
}

function isPainterPinHash(value) {
  return typeof value === 'string' && /^pin\$[^$]+\$[a-f0-9]+$/i.test(value)
}

function verifyPainterPin(pin, storedHash) {
  if (!isPainterPinHash(storedHash)) return false
  const [, salt, digest] = storedHash.split('$')
  const expected = crypto.scryptSync(String(pin), salt, 32).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(expected, 'hex'))
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function monthStart(dateString) {
  const date = new Date(`${dateString}T12:00:00Z`)
  date.setUTCDate(1)
  return date.toISOString().slice(0, 10)
}

function addMonths(dateString, count) {
  const date = new Date(`${dateString}T12:00:00Z`)
  date.setUTCDate(1)
  date.setUTCMonth(date.getUTCMonth() + count)
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

function slugifyPainterName(name = '') {
  return String(name)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'malir'
}

function buildPainterPortalPath(painter) {
  const slug = slugifyPainterName(painter?.name)
  return `/maliri/${slug}`
}

function buildPainterPortalUrl(painter, req) {
  return `${getAppBaseUrl(req)}${buildPainterPortalPath(painter)}`
}

function normalizePainter(painter) {
  const next = { ...painter }
  next.service_areas = normalizeList(next.service_areas || next.approx_location || 'Praha')
  next.work_types = normalizeList(next.work_types || next.specialties || ['Běžná bílá výmalba'])
  next.reliability_score = Number(next.reliability_score || 4.5)
  next.is_express_enabled = Boolean(next.is_express_enabled)
  next.notes = next.notes || ''
  if (!next.portal_access_token || !String(next.portal_access_token).startsWith('sv_')) {
    next.portal_access_token = randomSessionVersion()
  }
  if (!isPainterPinHash(next.portal_token_hash)) {
    next.portal_token_hash = hashPainterPin(deriveDefaultPainterPin(next))
  }
  next.created_at = next.created_at || nowIso()
  next.updated_at = nowIso()
  return next
}

function findPainterBySlug(state, slug) {
  const normalized = slugifyPainterName(slug)
  return state.painters.find((item) => slugifyPainterName(item.name) === normalized) || null
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

function ensureDefaultAvailability(state, days = 180) {
  const start = todayIso()
  const existingKeys = new Set(state.painter_availability.map((row) => `${row.painter_id}|${row.date}`))
  for (const painter of state.painters) {
    for (let offset = 0; offset < days; offset += 1) {
      const date = addDays(start, offset)
      const key = `${painter.id}|${date}`
      if (!existingKeys.has(key)) {
        state.painter_availability.push(seedAvailabilityRow(painter, date))
        existingKeys.add(key)
      }
    }
  }
}

function normalizeState(state) {
  const defaultPaintersByName = new Map(DEFAULT_PAINTERS.map((painter) => [painter.name, painter]))
  const existingPaintersByName = new Map((Array.isArray(state.painters) ? state.painters : []).map((painter) => [painter.name, painter]))
  state.jobs = Array.isArray(state.jobs) ? state.jobs : []
  state.job_photos = Array.isArray(state.job_photos) ? state.job_photos : []
  state.painters = DEFAULT_PAINTERS.map((defaultPainter) => {
    const item = existingPaintersByName.get(defaultPainter.name) || defaultPainter
    const email = item.email && String(item.email).endsWith('@malirhned.cz')
      ? item.email
      : defaultPainter.email
    const merged = {
      ...defaultPainter,
      id: item.id || createId(),
      ...item,
      name: defaultPainter.name || item.name,
      email,
      phone: item.phone || defaultPainter.phone,
      image_url: defaultPainter.image_url || item.image_url,
      image_position: defaultPainter.image_position || item.image_position,
      experience_label: defaultPainter.experience_label || item.experience_label,
      role: defaultPainter.role || item.role,
      summary: defaultPainter.summary || item.summary,
      price_label: defaultPainter.price_label || item.price_label,
      response_label: defaultPainter.response_label || item.response_label,
      jobs_label: defaultPainter.jobs_label || item.jobs_label,
      specialties: defaultPainter.specialties || item.specialties,
      service_areas: defaultPainter.service_areas || item.service_areas,
      work_types: defaultPainter.work_types || item.work_types,
      is_express_enabled: defaultPainter.is_express_enabled ?? item.is_express_enabled,
      reliability_score: defaultPainter.reliability_score || item.reliability_score,
    }
    return normalizePainter(merged)
  })
  // Include painters from DB that are not in DEFAULT_PAINTERS (added dynamically)
  const defaultNames = new Set(DEFAULT_PAINTERS.map((p) => p.name))
  for (const [name, item] of existingPaintersByName) {
    if (!defaultNames.has(name)) {
      state.painters.push(normalizePainter(item))
    }
  }
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
  const now = new Date()
  return state.painter_capacity_blocks.filter((row) =>
    row.painter_id === painterId &&
    row.date === date &&
    row.status === CAPACITY_BLOCK_STATUSES.ACTIVE &&
    (row.block_type !== CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD || !row.expires_at || new Date(row.expires_at) > now)
  )
}

function getRemainingCapacity(state, painter, date) {
  const availability = getAvailabilityForDate(state, painter.id, date)
  const baseCapacity = Number(availability?.capacity ?? 1)
  const activeBlocks = getActiveBlocksForDate(state, painter.id, date)
  return Math.max(0, baseCapacity - activeBlocks.length)
}

function getJobHoldDates(state, jobId, blockType = null) {
  return [...new Set(
    state.painter_capacity_blocks
      .filter((row) =>
        row.job_id === jobId &&
        row.status === CAPACITY_BLOCK_STATUSES.ACTIVE &&
        (!blockType || row.block_type === blockType),
      )
      .map((row) => row.date)
      .sort((a, b) => a.localeCompare(b))
  )]
}

function releaseJobCapacityBlocks(state, jobId, blockType = null) {
  const releasedDates = []
  for (const block of state.painter_capacity_blocks.filter((row) =>
    row.job_id === jobId &&
    row.status === CAPACITY_BLOCK_STATUSES.ACTIVE &&
    (!blockType || row.block_type === blockType)
  )) {
    block.status = CAPACITY_BLOCK_STATUSES.RELEASED
    block.updated_at = nowIso()
    releasedDates.push(block.date)
  }
  return [...new Set(releasedDates)].sort((a, b) => a.localeCompare(b))
}

function createJobCapacityBlocks(state, { painterId, jobId, startDate, durationDays = 1, blockType, expiresAt = null }) {
  if (!painterId || !jobId || !startDate) return []
  const safeDuration = Math.max(1, Number(durationDays) || 1)
  const dates = []
  for (let offset = 0; offset < safeDuration; offset += 1) {
    const date = addDays(startDate, offset)
    state.painter_capacity_blocks.push(createCapacityBlock({
      painterId,
      jobId,
      date,
      blockType,
      expiresAt,
    }))
    dates.push(date)
  }
  return dates
}

function buildPainterPortalAvailability(state, painterId, rows) {
  return rows.map((row) => {
    const activeBlocks = getActiveBlocksForDate(state, painterId, row.date)
    if (!activeBlocks.length) return row
    const confirmedBlocks = activeBlocks.filter((item) => item.block_type === CAPACITY_BLOCK_TYPES.CONFIRMED_ASSIGNMENT)
    const temporaryBlocks = activeBlocks.filter((item) => item.block_type === CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD)
    return {
      ...row,
      status: AVAILABILITY_STATUSES.UNAVAILABLE,
      capacity: 0,
      block_count: activeBlocks.length,
      confirmed_blocks: confirmedBlocks.length,
      temporary_holds: temporaryBlocks.length,
      is_blocked: true,
      block_dates: activeBlocks.map((item) => item.date),
    }
  })
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

function buildDayPainters(state, date, job = null) {
  return state.painters
    .filter((painter) => painter.is_active)
    .map((painter) => {
      const availability = getAvailabilityForDate(state, painter.id, date)
      const remainingCapacity = getRemainingCapacity(state, painter, date)
      const activeBlocks = getActiveBlocksForDate(state, painter.id, date)
      const confirmedBlocks = activeBlocks.filter((row) => row.block_type === CAPACITY_BLOCK_TYPES.CONFIRMED_ASSIGNMENT)
      const temporaryBlocks = activeBlocks.filter((row) => row.block_type === CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD)
      const suggestion = job ? buildSuggestedPainter(state, job, painter) : null
      const status = availability?.status || AVAILABILITY_STATUSES.UNAVAILABLE
      const blocked = activeBlocks.length > 0 || remainingCapacity <= 0

      return {
        id: painter.id,
        name: painter.name,
        role: painter.role,
        service_areas: painter.service_areas,
        work_types: painter.work_types,
        reliability_score: painter.reliability_score,
        portal_url: buildPainterPortalPath(painter),
        availability_status: status,
        accepts_express: Boolean(availability?.accepts_express ?? painter.is_express_enabled),
        capacity: Number(availability?.capacity ?? 1),
        remaining_capacity: remainingCapacity,
        note: availability?.note || '',
        painter_note: painter.notes || '',
        block_count: activeBlocks.length,
        active_blocks: activeBlocks,
        confirmed_blocks: confirmedBlocks.length,
        temporary_holds: temporaryBlocks.length,
        is_blocked: blocked,
        display_status: blocked
          ? 'Blokovaný zakázkou'
          : status === AVAILABILITY_STATUSES.AVAILABLE
            ? 'Dostupný'
            : status === AVAILABILITY_STATUSES.LIMITED
              ? 'Omezeně dostupný'
              : 'Nedostupný',
        job_fit: suggestion ? {
          score: suggestion.score,
          locality_match: suggestion.locality_match,
          work_type_match: suggestion.work_type_match,
          express_match: suggestion.express_match,
          display_status: suggestion.display_status,
        } : null,
      }
    })
    .sort((a, b) => {
      const scoreA = a.job_fit?.score ?? 0
      const scoreB = b.job_fit?.score ?? 0
      if (scoreB !== scoreA) return scoreB - scoreA
      return a.name.localeCompare(b.name, 'cs')
    })
}

function buildAdminAvailabilityCalendar(state, options = {}) {
  const start = monthStart(options.from || todayIso())
  const monthsCount = Math.min(Math.max(Number(options.months) || 2, 1), 4)
  const untilMonth = addMonths(start, monthsCount)
  const totalDays = Math.round((new Date(`${untilMonth}T12:00:00Z`) - new Date(`${start}T12:00:00Z`)) / 86400000)
  const months = buildMonthBuckets(start, totalDays)
  const monthMap = new Map(months.map((month) => [month.key, month]))
  const job = options.jobId ? state.jobs.find((item) => item.id === options.jobId) || null : null
  const dayMap = {}

  for (let offset = 0; offset < totalDays; offset += 1) {
    const date = addDays(start, offset)
    const d = new Date(`${date}T12:00:00Z`)
    const monthKey = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`
    const month = monthMap.get(monthKey)
    const painters = buildDayPainters(state, date, job)
    const availableCount = painters.filter((item) => item.availability_status === AVAILABILITY_STATUSES.AVAILABLE && !item.is_blocked).length
    const limitedCount = painters.filter((item) => item.availability_status === AVAILABILITY_STATUSES.LIMITED && !item.is_blocked).length
    const unavailableCount = painters.filter((item) => item.availability_status === AVAILABILITY_STATUSES.UNAVAILABLE).length
    const blockedCount = painters.filter((item) => item.is_blocked).length
    const availableSlots = painters.reduce((sum, item) => sum + Math.max(0, Number(item.remaining_capacity || 0)), 0)
    const suitablePainters = job ? painters.filter((item) => (item.job_fit?.score ?? 0) > 0) : []

    let serviceStatus = 'plno'
    let serviceLabel = 'Plno / nedostupné'
    if (availableSlots >= 3) {
      serviceStatus = 'volno'
      serviceLabel = 'Volno'
    } else if (availableSlots === 2) {
      serviceStatus = 'omezena_kapacita'
      serviceLabel = 'Omezená kapacita'
    } else if (availableSlots === 1) {
      serviceStatus = 'posledni_misto'
      serviceLabel = 'Poslední místo'
    }

    const summary = {
      d: d.getUTCDate(),
      date,
      available_count: availableCount,
      limited_count: limitedCount,
      unavailable_count: unavailableCount,
      blocked_count: blockedCount,
      available_slots: availableSlots,
      suitable_painters_count: suitablePainters.length,
      service_status: serviceStatus,
      service_label: serviceLabel,
    }

    month.cal.push(summary)
    dayMap[date] = {
      ...summary,
      painters,
    }
  }

  const selectedDate = options.date && dayMap[options.date] ? options.date : Object.keys(dayMap)[0] || start

  return {
    months,
    selected_date: selectedDate,
    selected_day: dayMap[selectedDate] || null,
    days: dayMap,
    job: job ? buildJobSummary(state, job) : null,
  }
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
    duration_days: Math.max(1, getJobHoldDates(state, job.id).length || Number(job.duration_days) || Number(job.estimated_days) || 1),
    waiting_label: job.created_at,
    last_activity_at: events[0]?.created_at || job.updated_at,
    last_offered_painter_name: offers[0]?.painter_name || null,
    suitable_painters_count: suggestedPainters.filter((painter) => painter.score > 0).length,
    best_painter_status: suggestedPainters[0]?.display_status || 'Bez doporučení',
  }
}

class JsonStateStore {
  constructor() {
    // In-process mutex — prevents concurrent read-modify-write races within one Vercel instance.
    // Does not protect across multiple instances; for that, use DB-level row locking.
    this._lock = Promise.resolve()
  }

  _withLock(fn) {
    const next = this._lock.then(() => fn())
    this._lock = next.catch(() => {})
    return next
  }

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
    return this._withLock(() => this.writeRawState(normalizeState(state)))
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

    const baseUrl = getAppBaseUrl(req)
    const adminUrl = `${baseUrl}/admin`
    try {
      await Promise.all([
        job.client_email ? sendJobReceived({ job, publicUrl: links.publicUrl, cancelUrl: links.cancelUrl }) : Promise.resolve(),
        sendAdminNewJob({ job, adminUrl }),
      ])
    } catch (emailErr) {
      console.error('Email send failed after job creation:', emailErr)
    }

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
        slug: slugifyPainterName(painter.name),
        portal_url: buildPainterPortalPath(painter),
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

  async sendOffer(jobId, painterId, adminEmail, req, durationDays = 1) {
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
    const releasedDates = releaseJobCapacityBlocks(state, jobId, CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD)
    if (releasedDates.length > 0) {
      state.job_events.push(createEvent({ jobId, actorType: 'system', actorLabel: 'System', eventType: EVENT_TYPES.CAPACITY_BLOCK_RELEASED, payload: { blockType: CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD, dates: releasedDates } }))
    }
    if (job.preferred_date) {
      const holdDates = createJobCapacityBlocks(state, {
        painterId,
        jobId,
        startDate: job.preferred_date,
        durationDays,
        blockType: CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD,
        expiresAt,
      })
      if (holdDates.length > 0) {
        state.job_events.push(createEvent({ jobId, offerId: offer.id, actorType: 'system', actorLabel: 'System', eventType: EVENT_TYPES.CAPACITY_BLOCK_CREATED, payload: { blockType: CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD, dates: holdDates } }))
      }
    }
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
        payload: { offerUrl: buildPainterPortalUrl(painter, req) },
      }),
    )
    await this.writeState(state)

    const offerUrl = buildPainterPortalUrl(painter, req)
    const portalUrl = buildPainterPortalUrl(painter, req)
    if (painter.email) {
      await sendPainterOffer({ painter, job, offerUrl, expiresAt })
    }
    sendPushToAll(painter.id, {
      title: '🎨 Nová zakázka pro vás',
      body: `${job.locality || job.work_type || 'Zakázka'} · ${job.size_label || ''} · reagujte do ${new Intl.DateTimeFormat('cs-CZ', { hour: '2-digit', minute: '2-digit' }).format(new Date(expiresAt))}`,
      url: portalUrl,
    }).catch(() => {})

    return { job, offer, offerUrl }
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

  async respondToOffer(token, decision, estimatedDays) {
    const state = await this.readState()
    const offer = state.job_offers.find((item) => item.token_hash === hashToken(token))
    if (!offer) throw new Error('Tato nabídka už není dostupná.')
    const job = state.jobs.find((item) => item.id === offer.job_id)
    if (!job) throw new Error('Zakázka nebyla nalezena.')
    if (job.status === JOB_STATUSES.CANCELED) throw new Error('Tato nabídka už není dostupná.')
    if (offer.status !== OFFER_STATUSES.PENDING) throw new Error('Tato nabídka už není dostupná.')
    if (new Date(offer.expires_at).getTime() < Date.now()) {
      offer.status = OFFER_STATUSES.EXPIRED
      offer.updated_at = nowIso()
      const releasedDates = releaseJobCapacityBlocks(state, job.id, CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD)
      if (releasedDates.length > 0) {
        state.job_events.push(createEvent({ jobId: job.id, actorType: 'system', actorLabel: 'System', eventType: EVENT_TYPES.CAPACITY_BLOCK_RELEASED, payload: { blockType: CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD, dates: releasedDates } }))
      }
      state.job_events.push(createEvent({ jobId: job.id, offerId: offer.id, actorType: 'system', actorLabel: 'System', eventType: EVENT_TYPES.OFFER_EXPIRED }))
      await this.writeState(state)
      throw new Error('Tato nabídka už není dostupná.')
    }
    if (state.job_offers.some((item) => item.job_id === job.id && item.status === OFFER_STATUSES.ACCEPTED && item.id !== offer.id)) {
      throw new Error('Tato nabídka už není dostupná.')
    }

    if (decision === 'accept' || decision === 'accepted') {
      offer.status = OFFER_STATUSES.ACCEPTED
      offer.accepted_at = nowIso()
      offer.updated_at = nowIso()
      if (estimatedDays && Number(estimatedDays) > 0) {
        offer.estimated_days = Number(estimatedDays)
      }
      job.status = JOB_STATUSES.PAINTER_ACCEPTED
      job.selected_offer_id = offer.id
      job.selected_painter_id = offer.painter_id
      job.selected_painter_name = offer.painter_name
      job.assigned_painter_id = offer.painter_id
      if (estimatedDays && Number(estimatedDays) > 0) {
        job.estimated_days = Number(estimatedDays)
      }
      job.updated_at = nowIso()
      if (job.preferred_date) {
        const releasedDates = releaseJobCapacityBlocks(state, job.id, CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD)
        if (releasedDates.length > 0) {
          state.job_events.push(createEvent({ jobId: job.id, actorType: 'system', actorLabel: 'System', eventType: EVENT_TYPES.CAPACITY_BLOCK_RELEASED, payload: { blockType: CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD, dates: releasedDates } }))
        }
        const durationDays = Math.max(1, Number(estimatedDays) || releasedDates.length || 1)
        const holdDates = createJobCapacityBlocks(state, {
          painterId: offer.painter_id,
          jobId: job.id,
          startDate: job.preferred_date,
          durationDays,
          blockType: CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD,
          expiresAt: offer.expires_at,
        })
        state.job_events.push(createEvent({ jobId: job.id, offerId: offer.id, actorType: 'system', actorLabel: 'System', eventType: EVENT_TYPES.CAPACITY_BLOCK_CREATED, payload: { blockType: CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD, dates: holdDates } }))
      }
      state.job_events.push(createEvent({ jobId: job.id, offerId: offer.id, actorType: 'painter', actorId: offer.painter_id, actorLabel: offer.painter_name, eventType: EVENT_TYPES.OFFER_ACCEPTED }))
    } else {
      offer.status = OFFER_STATUSES.DECLINED
      offer.declined_at = nowIso()
      offer.updated_at = nowIso()
      job.status = JOB_STATUSES.READY_TO_OFFER
      job.assigned_painter_id = null
      job.updated_at = nowIso()
      const releasedDates = releaseJobCapacityBlocks(state, job.id, CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD)
      if (releasedDates.length > 0) {
        state.job_events.push(createEvent({ jobId: job.id, actorType: 'system', actorLabel: 'System', eventType: EVENT_TYPES.CAPACITY_BLOCK_RELEASED, payload: { blockType: CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD, dates: releasedDates } }))
      }
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

    const releasedDates = releaseJobCapacityBlocks(state, jobId, CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD)
    if (releasedDates.length > 0) {
      state.job_events.push(createEvent({ jobId, actorType: 'system', actorLabel: 'System', eventType: EVENT_TYPES.CAPACITY_BLOCK_RELEASED, payload: { blockType: CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD, dates: releasedDates } }))
    }

    const confirmationDates = releasedDates.length > 0 ? releasedDates : (job.preferred_date ? [job.preferred_date] : [])
    if (confirmationDates.length > 0 && job.selected_painter_id) {
      for (const date of confirmationDates) {
        state.painter_capacity_blocks.push(createCapacityBlock({
          painterId: job.selected_painter_id,
          jobId,
          date,
          blockType: CAPACITY_BLOCK_TYPES.CONFIRMED_ASSIGNMENT,
        }))
      }
      state.job_events.push(createEvent({ jobId, offerId: winningOffer.id, actorType: 'system', actorLabel: 'System', eventType: EVENT_TYPES.CAPACITY_BLOCK_CREATED, payload: { blockType: CAPACITY_BLOCK_TYPES.CONFIRMED_ASSIGNMENT, dates: confirmationDates } }))
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

    // Emaily po potvrzení přiřazení — await so Vercel doesn't kill process before send
    const baseUrl = getAppBaseUrl()
    const winningPainter = state.painters.find((p) => p.id === winningOffer.painter_id)
    const emailTasks = []
    if (job.client_email && winningPainter) {
      const publicToken = job.public_token
      const publicUrl = publicToken ? `${baseUrl}/zakazka?token=${publicToken}` : `${baseUrl}/zakazka`
      emailTasks.push(sendJobAssigned({ job, painter: winningPainter, publicUrl }))
    }
    if (winningPainter?.email) {
      const portalToken = winningPainter.portal_access_token
      const portalUrl = portalToken ? `${baseUrl}${buildPainterPortalPath(winningPainter)}` : `${baseUrl}/maliri`
      emailTasks.push(sendPainterContactUnlocked({ painter: winningPainter, job, portalUrl }))
    }
    await Promise.all(emailTasks)
    if (winningPainter) {
      sendPushToAll(winningPainter.id, {
        title: '✅ Zakázka potvrzena',
        body: `${job.reference} · Kontakt na klienta odemčen.`,
        url: `${baseUrl}${buildPainterPortalPath(winningPainter)}`,
      }).catch(() => {})
    }

    return job
  }

  async returnToDispatch(jobId, adminEmail) {
    const state = await this.readState()
    const job = state.jobs.find((item) => item.id === jobId)
    if (!job) throw new Error('Zakázka nebyla nalezena.')
    // Withdraw all accepted and pending offers so they can't be re-accepted later
    for (const offer of state.job_offers.filter(
      (item) => item.job_id === jobId &&
        (item.status === OFFER_STATUSES.ACCEPTED || item.status === OFFER_STATUSES.PENDING)
    )) {
      offer.status = OFFER_STATUSES.WITHDRAWN
      offer.withdrawn_at = nowIso()
      offer.updated_at = nowIso()
      state.job_events.push(createEvent({ jobId, offerId: offer.id, actorType: 'system', actorLabel: 'System', eventType: EVENT_TYPES.OFFER_WITHDRAWN }))
    }
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
    if (nextStatus === JOB_STATUSES.DONE) {
      job.completed_at = nowIso()
      for (const block of state.painter_capacity_blocks.filter(
        (item) => item.job_id === jobId && item.status === CAPACITY_BLOCK_STATUSES.ACTIVE
      )) {
        block.status = CAPACITY_BLOCK_STATUSES.RELEASED
        block.updated_at = nowIso()
      }
    }
    const eventType = nextStatus === JOB_STATUSES.IN_PROGRESS ? EVENT_TYPES.JOB_MARKED_IN_PROGRESS : nextStatus === JOB_STATUSES.DONE ? EVENT_TYPES.JOB_COMPLETED : EVENT_TYPES.JOB_REVIEWED
    state.job_events.push(createEvent({ jobId, actorType: 'admin', actorLabel: adminEmail, eventType }))
    await this.writeState(state)
    return job
  }

  async setJobStatus(jobId, adminEmail, newStatus) {
    const state = await this.readState()
    const job = state.jobs.find((item) => item.id === jobId)
    if (!job) throw new Error('Zakázka nebyla nalezena.')
    job.status = newStatus
    job.updated_at = nowIso()
    state.job_events.push(createEvent({ jobId, actorType: 'admin', actorLabel: adminEmail, eventType: EVENT_TYPES.JOB_REVIEWED }))
    await this.writeState(state)
    return job
  }

  async addJobNote(jobId, adminEmail, note) {
    const state = await this.readState()
    const job = state.jobs.find((item) => item.id === jobId)
    if (!job) throw new Error('Zakázka nebyla nalezena.')
    if (!job.internal_notes) job.internal_notes = []
    job.internal_notes.push({ text: note, author: adminEmail, at: nowIso() })
    job.updated_at = nowIso()
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
    job.assigned_at = null
    job.assigned_painter_id = null
    job.selected_painter_id = null
    job.selected_offer_id = null
    job.selected_painter_name = null
    // Collect affected painters before withdrawing offers
    const affectedPainterIds = new Set()
    for (const offer of state.job_offers.filter((item) => item.job_id === jobId &&
      (item.status === OFFER_STATUSES.PENDING || item.status === OFFER_STATUSES.ACCEPTED))) {
      affectedPainterIds.add(offer.painter_id)
      offer.status = OFFER_STATUSES.WITHDRAWN
      offer.withdrawn_at = nowIso()
      offer.updated_at = nowIso()
    }
    const releasedTemporaryDates = releaseJobCapacityBlocks(state, jobId, CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD)
    if (releasedTemporaryDates.length > 0) {
      state.job_events.push(createEvent({ jobId, actorType: 'system', actorLabel: 'System', eventType: EVENT_TYPES.CAPACITY_BLOCK_RELEASED, payload: { blockType: CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD, dates: releasedTemporaryDates } }))
    }
    const releasedConfirmedDates = releaseJobCapacityBlocks(state, jobId, CAPACITY_BLOCK_TYPES.CONFIRMED_ASSIGNMENT)
    if (releasedConfirmedDates.length > 0) {
      state.job_events.push(createEvent({ jobId, actorType: 'system', actorLabel: 'System', eventType: EVENT_TYPES.CAPACITY_BLOCK_RELEASED, payload: { blockType: CAPACITY_BLOCK_TYPES.CONFIRMED_ASSIGNMENT, dates: releasedConfirmedDates } }))
    }
    state.job_events.push(createEvent({ jobId, actorType: 'admin', actorLabel: adminEmail, eventType: EVENT_TYPES.JOB_CANCELED }))
    await this.writeState(state)
    // Notify affected painters
    const baseUrl = getAppBaseUrl()
    for (const painterId of affectedPainterIds) {
      const painter = state.painters.find((p) => p.id === painterId)
      if (painter?.email) {
        const portalUrl = `${baseUrl}${buildPainterPortalPath(painter)}`
        sendPainterJobCancelled({ painter, job, portalUrl }).catch((e) => console.error('[email] cancel notify failed:', e))
        sendPushToAll(painterId, { title: 'Zakázka zrušena', body: `Zakázka ${job.reference} byla zrušena.`, url: portalUrl }).catch(() => {})
      }
    }
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
    job.assigned_at = null
    job.assigned_painter_id = null
    job.selected_painter_id = null
    job.selected_offer_id = null
    job.selected_painter_name = null
    // Withdraw pending offers + collect painters to notify
    const affectedPainterIds = new Set()
    for (const offer of state.job_offers.filter((item) => item.job_id === job.id &&
      (item.status === OFFER_STATUSES.PENDING || item.status === OFFER_STATUSES.ACCEPTED))) {
      affectedPainterIds.add(offer.painter_id)
      offer.status = OFFER_STATUSES.WITHDRAWN
      offer.withdrawn_at = nowIso()
      offer.updated_at = nowIso()
    }
    const releasedTemporaryDates = releaseJobCapacityBlocks(state, job.id, CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD)
    if (releasedTemporaryDates.length > 0) {
      state.job_events.push(createEvent({ jobId: job.id, actorType: 'system', actorLabel: 'System', eventType: EVENT_TYPES.CAPACITY_BLOCK_RELEASED, payload: { blockType: CAPACITY_BLOCK_TYPES.TEMPORARY_HOLD, dates: releasedTemporaryDates } }))
    }
    const releasedConfirmedDates = releaseJobCapacityBlocks(state, job.id, CAPACITY_BLOCK_TYPES.CONFIRMED_ASSIGNMENT)
    if (releasedConfirmedDates.length > 0) {
      state.job_events.push(createEvent({ jobId: job.id, actorType: 'system', actorLabel: 'System', eventType: EVENT_TYPES.CAPACITY_BLOCK_RELEASED, payload: { blockType: CAPACITY_BLOCK_TYPES.CONFIRMED_ASSIGNMENT, dates: releasedConfirmedDates } }))
    }
    state.job_events.push(createEvent({ jobId: job.id, actorType: 'client', actorLabel: job.client_name || 'Klient', eventType: EVENT_TYPES.JOB_CANCELED }))
    await this.writeState(state)
    const baseUrl = getAppBaseUrl()
    for (const painterId of affectedPainterIds) {
      const painter = state.painters.find((p) => p.id === painterId)
      if (painter?.email) {
        const portalUrl = `${baseUrl}${buildPainterPortalPath(painter)}`
        sendPainterJobCancelled({ painter, job, portalUrl }).catch((e) => console.error('[email] cancel notify failed:', e))
        sendPushToAll(painterId, { title: 'Zakázka zrušena', body: `Zakázka ${job.reference} byla zrušena zákazníkem.`, url: portalUrl }).catch(() => {})
      }
    }
    return job
  }

  async getPublicAvailabilityCalendar(options = {}) {
    const state = await this.readState()
    return { months: buildPublicCalendar(state, options) }
  }

  async getAdminAvailabilityCalendar(options = {}) {
    const state = await this.readState()
    return buildAdminAvailabilityCalendar(state, options)
  }

  async getPainterPortal(token) {
    const state = await this.readState()
    const painter = state.painters.find((item) => item.id === token)
    if (!painter) return null
    return this.buildPainterPortalResponse(state, painter)
  }

  buildPainterPortalResponse(state, painter) {
    const today = todayIso()
    ensureDefaultAvailability(state, 180)
    const availability = buildPainterPortalAvailability(state, painter.id, state.painter_availability
      .filter((row) => row.painter_id === painter.id && row.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 180))

    // Kontakt na klienta se odemyká až po potvrzení dispečinkem.
    const CONTACT_UNLOCKED_STATUSES = new Set([
      JOB_STATUSES.CLIENT_CONFIRMED,
      JOB_STATUSES.IN_PROGRESS,
      JOB_STATUSES.DONE,
    ])
    const maskJobContact = (job) => {
      if (!job) return null
      if (CONTACT_UNLOCKED_STATUSES.has(job.status)) return job
      return {
        ...job,
        client_name: null,
        client_phone: null,
        client_email: null,
        client_address: '',
        address: '',
        client_note: sanitizeNote(job.client_note || ''),
        contact_locked: true,
      }
    }

    const offers = state.job_offers
      .filter((row) => row.painter_id === painter.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 12)
      .map((offer) => ({
        ...offer,
        offer_token: undefined,
        job: maskJobContact(state.jobs.find((job) => job.id === offer.job_id) || null),
      }))
    const jobs = state.jobs
      .filter((job) => job.assigned_painter_id === painter.id && job.status !== JOB_STATUSES.CANCELED)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(maskJobContact)
    const safePainter = { ...painter }
    delete safePainter.portal_access_token
    delete safePainter.portal_token_hash
    return { painter: safePainter, availability, offers, jobs }
  }

  async getPainterPortalBySlug(slug) {
    const state = await this.readState()
    const painter = findPainterBySlug(state, slug)
    if (!painter) return null
    return {
      painter: {
        id: painter.id,
        name: painter.name,
        slug: slugifyPainterName(painter.name),
      },
    }
  }

  async getPainterPortalBySession(painterId, sessionVersion) {
    const state = await this.readState()
    const painter = state.painters.find((item) => item.id === painterId && item.portal_access_token === sessionVersion)
    if (!painter) return null
    return this.buildPainterPortalResponse(state, painter)
  }

  async authenticatePainterByPin(slug, pin) {
    const state = await this.readState()
    const painter = findPainterBySlug(state, slug)
    if (!painter) return null
    if (!verifyPainterPin(pin, painter.portal_token_hash)) return { ok: false, painter }
    if (!painter.portal_access_token || !String(painter.portal_access_token).startsWith('sv_')) {
      painter.portal_access_token = randomSessionVersion()
      painter.updated_at = nowIso()
      await this.writeState(state)
    }
    return {
      ok: true,
      painter,
      sessionVersion: painter.portal_access_token,
    }
  }

  async updatePainterAvailabilityByPainterId(painterId, payload) {
    const state = await this.readState()
    const painter = state.painters.find((item) => item.id === painterId)
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
    return this.getPainterPortal(painter.id)
  }

  async updatePainterAvailability(token, payload) {
    return this.updatePainterAvailabilityByPainterId(token, payload)
  }

  async respondToOfferByPainterId(painterId, offerId, decision, estimatedDays) {
    const state = await this.readState()
    const offer = state.job_offers.find((item) => item.id === offerId && item.painter_id === painterId)
    if (!offer) throw new Error('Nabídka nebyla nalezena.')
    return this.respondToOffer(offer.offer_token, decision, estimatedDays)
  }

  async adminUpdatePainterAvailability(painterId, payload, adminEmail) {
    const state = await this.readState()
    const painter = state.painters.find((item) => item.id === painterId)
    if (!painter) throw new Error('Malíř nebyl nalezen.')

    const safeEntries = Array.isArray(payload?.entries) ? payload.entries : []
    for (const entry of safeEntries) {
      if (!entry?.date) continue
      const existing = state.painter_availability.find((row) => row.painter_id === painter.id && row.date === entry.date)
      const next = {
        status: entry.status || AVAILABILITY_STATUSES.AVAILABLE,
        capacity: Number(entry.capacity) >= 0 ? Number(entry.capacity) : 1,
        accepts_express: Boolean(entry.accepts_express),
        note: entry.note || '',
        source: 'admin',
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
      state.job_events.push(createEvent({
        jobId: payload.jobId || null,
        actorType: 'admin',
        actorLabel: adminEmail,
        eventType: EVENT_TYPES.PAINTER_AVAILABILITY_UPDATED,
        payload: { painterId: painter.id, date: entry.date, status: next.status },
      }))
    }
    await this.writeState(state)
    return buildAdminAvailabilityCalendar(state, {
      from: payload.from,
      months: payload.months,
      date: payload.date,
      jobId: payload.jobId,
    })
  }

  async setPainterPin(painterId, pin, adminEmail) {
    const state = await this.readState()
    const painter = state.painters.find((item) => item.id === painterId)
    if (!painter) throw new Error('Malíř nebyl nalezen.')
    if (!/^\d{6}$/.test(String(pin || ''))) throw new Error('PIN musí mít přesně 6 číslic.')
    painter.portal_token_hash = hashPainterPin(String(pin))
    painter.portal_access_token = randomSessionVersion()
    painter.updated_at = nowIso()
    await this.writeState(state)
    return {
      painterId: painter.id,
      painterName: painter.name,
      portalUrl: buildPainterPortalPath(painter),
    }
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

// ---------------------------------------------------------------------------
// SupabaseDbStore — reads/writes individual Postgres tables via supabase-js.
// This replaces SupabaseStorageStore as the production backend.
// The class still inherits all business-logic methods from JsonStateStore by
// implementing readRawState / writeRawState as a full-state round-trip.  This
// is intentionally kept simple so no business logic has to change; the only
// trade-off is that every mutating operation does one full read + write, which
// is fine for this workload.
// ---------------------------------------------------------------------------
class SupabaseDbStore extends JsonStateStore {
  constructor() {
    super()
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
    this.db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  // ---- helpers ----

  async _q(table, query) {
    const { data, error } = await query
    if (error) throw new Error(`DB error on ${table}: ${error.message}`)
    return data || []
  }

  async _upsert(table, rows, onConflict = 'id') {
    if (!rows.length) return
    const { error } = await this.db.from(table).upsert(rows, { onConflict })
    if (error) throw new Error(`DB upsert error on ${table}: ${error.message}`)
  }

  async _update(table, id, patch) {
    const { error } = await this.db.from(table).update({ ...patch, updated_at: nowIso() }).eq('id', id)
    if (error) throw new Error(`DB update error on ${table}: ${error.message}`)
  }

  async _insert(table, row) {
    const { error } = await this.db.from(table).insert(row)
    if (error) throw new Error(`DB insert error on ${table}: ${error.message}`)
  }

  // ---- JsonStateStore protocol ----

  // Override readState: skip the normalise-then-write-back that the base class does.
  // The DB is already normalised; seeding default availability is handled lazily by
  // ensureDefaultAvailability inside the business-logic methods.
  async readState() {
    return normalizeState(await this.readRawState())
  }

  async readRawState() {
    const [
      painters,
      jobs,
      job_photos,
      job_offers,
      job_events,
      notifications,
      painter_availability,
      painter_capacity_blocks,
      admin_users,
    ] = await Promise.all([
      this._q('painters', this.db.from('painters').select('*').order('created_at')),
      this._q('jobs', this.db.from('jobs').select('*').order('created_at', { ascending: false })),
      this._q('job_photos', this.db.from('job_photos').select('*').order('created_at')),
      this._q('job_offers', this.db.from('job_offers').select('*').order('created_at', { ascending: false })),
      this._q('job_events', this.db.from('job_events').select('*').order('created_at', { ascending: false })),
      this._q('notifications', this.db.from('notifications').select('*').order('created_at', { ascending: false })),
      this._q('painter_availability', this.db.from('painter_availability').select('*').order('date')),
      this._q('painter_capacity_blocks', this.db.from('painter_capacity_blocks').select('*').order('created_at')),
      this._q('admin_users', this.db.from('admin_users').select('*').order('created_at')),
    ])
    // Track IDs of rows that already exist in DB so writeRawState can skip re-inserting them
    this._knownEventIds = new Set(job_events.map((r) => r.id))
    this._knownNotifIds = new Set(notifications.map((r) => r.id))
    return { painters, jobs, job_photos, job_offers, job_events, notifications, painter_availability, painter_capacity_blocks, admin_users }
  }

  async writeRawState(state) {
    // Upsert everything in parallel, batching large arrays
    const painters = (state.painters || []).map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email || null,
      phone: p.phone || null,
      approx_location: p.approx_location || null,
      experience_label: p.experience_label || null,
      role: p.role || null,
      summary: p.summary || null,
      price_label: p.price_label || null,
      response_label: p.response_label || null,
      jobs_label: p.jobs_label || null,
      image_url: p.image_url || null,
      image_position: p.image_position || null,
      specialties: p.specialties || [],
      is_active: p.is_active ?? true,
      service_areas: p.service_areas || [],
      work_types: p.work_types || [],
      is_express_enabled: p.is_express_enabled ?? false,
      reliability_score: p.reliability_score ?? 4.5,
      notes: p.notes || null,
      portal_access_token: p.portal_access_token || null,
      portal_token_hash: p.portal_token_hash || null,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }))

    const jobs = (state.jobs || []).map((j) => ({
      id: j.id,
      reference: j.reference,
      public_token_hash: j.public_token_hash || '',
      cancel_token_hash: j.cancel_token_hash || '',
      public_token: j.public_token || null,
      cancel_token: j.cancel_token || null,
      status: j.status,
      client_name: j.client_name || null,
      client_phone: j.client_phone || null,
      client_email: j.client_email || null,
      address: j.address || null,
      locality: j.locality || null,
      service_area: j.service_area || null,
      client_address: j.client_address || null,
      client_note: j.client_note || null,
      notes: j.notes || null,
      booking_note: j.booking_note || null,
      preferred_date: j.preferred_date || null,
      preferred_date_label: j.preferred_date_label || null,
      preferred_time_label: j.preferred_time_label || null,
      work_type: j.work_type || null,
      property_type: j.property_type || null,
      space_type: j.space_type || null,
      room_count: j.room_count || null,
      size_label: j.size_label || null,
      square_meters: j.square_meters || null,
      custom_area: j.custom_area || null,
      area_mode: j.area_mode || null,
      ceiling_height: j.ceiling_height || null,
      repairs: j.repairs || null,
      material: j.material || null,
      furniture_moving: j.furniture_moving || null,
      covering: j.covering || null,
      cleaning: j.cleaning || null,
      empty_space: j.empty_space || null,
      carpets: j.carpets || null,
      approximate_location: j.approximate_location || null,
      estimated_client_price_min: j.estimated_client_price_min || null,
      estimated_client_price_max: j.estimated_client_price_max || null,
      estimated_price_low: j.estimated_price_low || null,
      estimated_price_high: j.estimated_price_high || null,
      confirmed_client_price: j.confirmed_client_price || null,
      confirmed_price: j.confirmed_price || null,
      painter_reward: j.painter_reward || null,
      painter_payout: j.painter_payout || null,
      assigned_painter_id: j.assigned_painter_id || null,
      selected_painter_id: j.selected_painter_id || null,
      selected_offer_id: j.selected_offer_id || null,
      selected_painter_name: j.selected_painter_name || null,
      needs_completion_reason: j.needs_completion_reason || null,
      internal_notes: j.internal_notes || [],
      created_at: j.created_at,
      updated_at: j.updated_at,
      cancelled_at: j.cancelled_at || null,
      completed_at: j.completed_at || null,
      assigned_at: j.assigned_at || null,
    }))

    const offers = (state.job_offers || []).map((o) => ({
      id: o.id,
      job_id: o.job_id,
      painter_id: o.painter_id,
      painter_name: o.painter_name,
      offer_token: o.offer_token || null,
      token_hash: o.token_hash,
      status: o.status,
      offered_reward: o.offered_reward || null,
      offered_payout: o.offered_payout || null,
      approx_location: o.approx_location || null,
      sanitized_note: o.sanitized_note || null,
      expires_at: o.expires_at,
      accepted_at: o.accepted_at || null,
      declined_at: o.declined_at || null,
      withdrawn_at: o.withdrawn_at || null,
      created_at: o.created_at,
      updated_at: o.updated_at,
    }))

    const events = (state.job_events || []).map((e) => ({
      id: e.id,
      job_id: e.job_id,
      offer_id: e.offer_id || null,
      actor_type: e.actor_type,
      actor_id: e.actor_id || null,
      actor_label: e.actor_label,
      event_type: e.event_type,
      payload: e.payload || {},
      created_at: e.created_at,
    }))

    const notifs = (state.notifications || []).map((n) => ({
      id: n.id,
      job_id: n.job_id,
      recipient_type: n.recipient_type || null,
      recipient_id: n.recipient_id || null,
      channel: n.channel,
      recipient: n.recipient,
      template_key: n.template_key,
      payload: n.payload || {},
      status: n.status || 'pending',
      sent_at: n.sent_at || null,
      created_at: n.created_at,
    }))

    const avail = (state.painter_availability || []).map((a) => ({
      id: a.id,
      painter_id: a.painter_id,
      date: a.date,
      status: a.status,
      capacity: a.capacity ?? 1,
      accepts_express: a.accepts_express ?? false,
      note: a.note || null,
      source: a.source || 'system',
      created_at: a.created_at,
      updated_at: a.updated_at,
    }))

    const blocks = (state.painter_capacity_blocks || []).map((b) => ({
      id: b.id,
      painter_id: b.painter_id,
      job_id: b.job_id,
      date: b.date,
      block_type: b.block_type,
      status: b.status,
      expires_at: b.expires_at || null,
      created_at: b.created_at,
      updated_at: b.updated_at,
    }))

    const adminUsers = (state.admin_users || []).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name || null,
      role: u.role || 'owner',
      created_at: u.created_at,
      updated_at: u.updated_at,
    }))

    // Insert-only for append-only tables (events and notifications only grow, never mutate)
    const newEvents = this._knownEventIds
      ? events.filter((e) => !this._knownEventIds.has(e.id))
      : events
    const newNotifs = this._knownNotifIds
      ? notifs.filter((n) => !this._knownNotifIds.has(n.id))
      : notifs

    // availability can be large — batch it
    const availBatches = []
    for (let i = 0; i < avail.length; i += 500) availBatches.push(avail.slice(i, i + 500))

    await Promise.all([
      this._upsert('painters', painters),
      this._upsert('jobs', jobs),
      this._upsert('job_offers', offers),
      newEvents.length ? this._upsert('job_events', newEvents) : Promise.resolve(),
      newNotifs.length ? this._upsert('notifications', newNotifs) : Promise.resolve(),
      this._upsert('painter_capacity_blocks', blocks),
      this._upsert('admin_users', adminUsers),
      ...availBatches.map((batch) => this._upsert('painter_availability', batch, 'painter_id,date')),
    ])
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
  async setJobStatus() { this.error() }
  async addJobNote() { this.error() }
  async cancelAdminJob() { this.error() }
  async getPublicJob() { this.error() }
  async completePublicJob() { this.error() }
  async cancelPublicJob() { this.error() }
  async getPublicAvailabilityCalendar() { this.error() }
  async getAdminAvailabilityCalendar() { this.error() }
  async getPainterPortal() { this.error() }
  async updatePainterAvailability() { this.error() }
  async adminUpdatePainterAvailability() { this.error() }
}

let cachedStore = null

export function getStore() {
  if (cachedStore) return cachedStore
  if (hasSupabaseConfig()) {
    const mode = getSupabaseStoreMode()
    // 'storage' forces the legacy JSON-blob backend; anything else (or unset) uses the DB tables
    cachedStore = mode === 'storage' ? new SupabaseStorageStore() : new SupabaseDbStore()
    return cachedStore
  }
  cachedStore = isProduction() ? new DisabledStore() : new DemoStore()
  return cachedStore
}
