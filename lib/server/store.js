import crypto from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import {
  buildApproxLocation,
  EVENT_TYPES,
  JOB_STATUSES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
  OFFER_STATUSES,
  sanitizeNote,
} from '../shared.js'
import { getAppBaseUrl, getOfferExpiryMinutes, hasSupabaseConfig, getSupabaseConfig } from './config.js'
import { DEFAULT_PAINTERS } from './painters.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../..')
const dataDir = path.join(rootDir, '.data')
const dataFile = path.join(dataDir, 'demo-store.json')

function randomToken() {
  return crypto.randomBytes(24).toString('base64url')
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function nowIso() {
  return new Date().toISOString()
}

function createReference() {
  return `MH-${Date.now().toString().slice(-7)}`
}

function createId() {
  return crypto.randomUUID()
}

function inferNotificationChannel(job) {
  return job.client_email ? NOTIFICATION_CHANNELS.EMAIL : NOTIFICATION_CHANNELS.SMS
}

function buildJobFromPayload(payload) {
  const preferredDate = payload.booking?.dateLabel || payload.booking?.preferredDate || ''
  const preferredTime = payload.booking?.slot || payload.booking?.preferredTime || ''

  return {
    id: createId(),
    reference: createReference(),
    status: JOB_STATUSES.WAITING_REVIEW,
    client_name: payload.customer?.name || '',
    client_phone: payload.customer?.phone || '',
    client_email: payload.customer?.email || '',
    client_address: payload.customer?.address || '',
    client_note: payload.customer?.notes || '',
    booking_note: payload.booking?.notes || '',
    property_type: payload.booking?.propertyType || '',
    room_count: payload.booking?.roomCount ? Number(payload.booking.roomCount) : null,
    area_mode: payload.booking?.areaMode || '',
    custom_area: payload.booking?.customArea ? Number(payload.booking.customArea) : null,
    ceiling_height: payload.booking?.ceilingHeight || '',
    work_type: payload.booking?.workType || '',
    repairs: payload.booking?.repairs || '',
    material: payload.booking?.material || '',
    furniture_moving: payload.booking?.furnitureMoving || '',
    covering: payload.booking?.covering || '',
    cleaning: payload.booking?.cleaning || '',
    empty_space: payload.booking?.emptySpace || '',
    carpets: payload.booking?.carpets || '',
    preferred_date_label: preferredDate,
    preferred_time_label: preferredTime,
    preferred_slot_id: payload.booking?.slotId || payload.booking?.slot || '',
    approximate_location: buildApproxLocation(payload.customer?.address || ''),
    estimated_price_low: payload.booking?.priceLow || null,
    estimated_price_high: payload.booking?.priceHigh || null,
    confirmed_price: null,
    painter_payout: null,
    selected_painter_id: null,
    selected_offer_id: null,
    selected_painter_name: null,
    needs_completion_reason: null,
    created_at: payload.submittedAt || nowIso(),
    updated_at: nowIso(),
    assigned_at: null,
    public_token_hash: '',
    cancel_token_hash: '',
  }
}

function decoratePublicJob(job, baseUrl) {
  const publicToken = randomToken()
  const cancelToken = randomToken()
  return {
    publicToken,
    cancelToken,
    publicUrl: `${baseUrl}/zakazka?token=${publicToken}`,
    cancelUrl: `${baseUrl}/zakazka?token=${publicToken}&mode=cancel&cancelToken=${cancelToken}`,
    tokenHashes: {
      public_token_hash: hashToken(publicToken),
      cancel_token_hash: hashToken(cancelToken),
    },
  }
}

function createNotification({ job, offerId = null, channel, recipient, templateKey, payload }) {
  return {
    id: createId(),
    job_id: job.id,
    offer_id: offerId,
    channel,
    recipient,
    template_key: templateKey,
    payload,
    status: NOTIFICATION_STATUSES.SKIPPED,
    sent_at: null,
    created_at: nowIso(),
  }
}

function createEvent({ jobId, offerId = null, eventType, actorType, actorLabel, payload = {} }) {
  return {
    id: createId(),
    job_id: jobId,
    offer_id: offerId,
    event_type: eventType,
    actor_type: actorType,
    actor_label: actorLabel,
    payload,
    created_at: nowIso(),
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
        painters: DEFAULT_PAINTERS.map((p) => ({ ...p, id: createId(), created_at: nowIso() })),
        job_offers: [],
        job_events: [],
        notifications: [],
        admin_users: [],
      }, null, 2),
      'utf8',
    )
  }
}

async function readDemoStore() {
  await ensureDemoStore()
  return JSON.parse(await readFile(dataFile, 'utf8'))
}

async function writeDemoStore(store) {
  await mkdir(dataDir, { recursive: true })
  await writeFile(dataFile, JSON.stringify(store, null, 2), 'utf8')
}

function buildJobSummary(job, offers, events) {
  const lastOffer = offers
    .filter((offer) => offer.job_id === job.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
  const lastEvent = events
    .filter((event) => event.job_id === job.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]

  return {
    ...job,
    waiting_label: job.created_at,
    last_activity_at: lastEvent?.created_at || job.updated_at,
    last_offered_painter_name: lastOffer?.painter_name || null,
  }
}

class DemoStore {
  async bootstrapAdminUser(email) {
    const store = await readDemoStore()
    const found = store.admin_users.find((item) => item.email === email)
    if (!found) {
      store.admin_users.push({
        id: createId(),
        email,
        name: 'Admin',
        is_active: true,
        created_at: nowIso(),
      })
      await writeDemoStore(store)
    }
  }

  async createJob(payload, req) {
    const store = await readDemoStore()
    const job = buildJobFromPayload(payload)
    const baseUrl = getAppBaseUrl(req)
    const links = decoratePublicJob(job, baseUrl)
    Object.assign(job, links.tokenHashes)

    store.jobs.unshift(job)
    store.job_events.push(
      createEvent({
        jobId: job.id,
        eventType: EVENT_TYPES.JOB_CREATED,
        actorType: 'client',
        actorLabel: job.client_name || 'Klient',
        payload: { reference: job.reference },
      }),
      createEvent({
        jobId: job.id,
        eventType: EVENT_TYPES.CLIENT_CONFIRMATION_QUEUED,
        actorType: 'system',
        actorLabel: 'System',
        payload: { channel: inferNotificationChannel(job) },
      }),
    )
    store.notifications.push(
      createNotification({
        job,
        channel: inferNotificationChannel(job),
        recipient: job.client_email || job.client_phone,
        templateKey: 'job_received',
        payload: links,
      }),
    )
    await writeDemoStore(store)

    return {
      job,
      links,
    }
  }

  async listJobs() {
    const store = await readDemoStore()
    return store.jobs.map((job) => buildJobSummary(job, store.job_offers, store.job_events))
  }

  async getJob(jobId) {
    const store = await readDemoStore()
    const job = store.jobs.find((item) => item.id === jobId)
    if (!job) return null
    return {
      job,
      offers: store.job_offers.filter((offer) => offer.job_id === jobId),
      events: store.job_events
        .filter((event) => event.job_id === jobId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
      painters: store.painters,
      notifications: store.notifications.filter((item) => item.job_id === jobId),
    }
  }

  async getPainters() {
    const store = await readDemoStore()
    return store.painters.filter((painter) => painter.is_active)
  }

  async requestCompletion(jobId, adminEmail, reason) {
    const store = await readDemoStore()
    const job = store.jobs.find((item) => item.id === jobId)
    if (!job) throw new Error('Zakázka nebyla nalezena.')

    job.status = JOB_STATUSES.WAITING_COMPLETION
    job.needs_completion_reason = reason || 'Prosíme o doplnění údajů.'
    job.updated_at = nowIso()
    store.job_events.push(
      createEvent({
        jobId,
        eventType: EVENT_TYPES.COMPLETION_REQUESTED,
        actorType: 'admin',
        actorLabel: adminEmail,
        payload: { reason: job.needs_completion_reason },
      }),
    )
    store.notifications.push(
      createNotification({
        job,
        channel: inferNotificationChannel(job),
        recipient: job.client_email || job.client_phone,
        templateKey: 'completion_requested',
        payload: { reason: job.needs_completion_reason },
      }),
    )
    await writeDemoStore(store)
    return job
  }

  async prepareJob(jobId, adminEmail, confirmedPrice, painterPayout) {
    const store = await readDemoStore()
    const job = store.jobs.find((item) => item.id === jobId)
    if (!job) throw new Error('Zakázka nebyla nalezena.')

    job.status = JOB_STATUSES.READY_TO_OFFER
    job.confirmed_price = Number(confirmedPrice) || null
    job.painter_payout = Number(painterPayout) || null
    job.updated_at = nowIso()
    store.job_events.push(
      createEvent({
        jobId,
        eventType: EVENT_TYPES.CLIENT_PRICE_SET,
        actorType: 'admin',
        actorLabel: adminEmail,
        payload: { confirmedPrice: job.confirmed_price },
      }),
      createEvent({
        jobId,
        eventType: EVENT_TYPES.PAINTER_PAYOUT_SET,
        actorType: 'admin',
        actorLabel: adminEmail,
        payload: { painterPayout: job.painter_payout },
      }),
    )
    await writeDemoStore(store)
    return job
  }

  async sendOffer(jobId, painterId, adminEmail, req) {
    const store = await readDemoStore()
    const job = store.jobs.find((item) => item.id === jobId)
    const painter = store.painters.find((item) => item.id === painterId)
    if (!job || !painter) throw new Error('Zakázka nebo malíř nebyl nalezen.')

    const token = randomToken()
    const baseUrl = getAppBaseUrl(req)
    const expiresAt = new Date(Date.now() + getOfferExpiryMinutes() * 60000).toISOString()
    const offer = {
      id: createId(),
      job_id: jobId,
      painter_id: painterId,
      painter_name: painter.name,
      status: OFFER_STATUSES.PENDING,
      token_hash: hashToken(token),
      offered_payout: job.painter_payout,
      approx_location: job.approximate_location,
      sanitized_note: sanitizeNote(`${job.booking_note}\n${job.client_note}`),
      expires_at: expiresAt,
      responded_at: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    }

    job.status = JOB_STATUSES.OFFERED
    job.updated_at = nowIso()
    store.job_offers.push(offer)
    store.job_events.push(
      createEvent({
        jobId,
        offerId: offer.id,
        eventType: EVENT_TYPES.OFFER_SENT,
        actorType: 'admin',
        actorLabel: adminEmail,
        payload: { painterName: painter.name, expiresAt },
      }),
    )
    store.notifications.push(
      createNotification({
        job,
        offerId: offer.id,
        channel: NOTIFICATION_CHANNELS.EMAIL,
        recipient: painter.email || painter.phone,
        templateKey: 'painter_offer',
        payload: { offerUrl: `${baseUrl}/nabidka?token=${token}` },
      }),
    )
    await writeDemoStore(store)

    return { job, offer, offerUrl: `${baseUrl}/nabidka?token=${token}` }
  }

  async getOfferByToken(token) {
    const store = await readDemoStore()
    const offer = store.job_offers.find((item) => item.token_hash === hashToken(token))
    if (!offer) return null

    const job = store.jobs.find((item) => item.id === offer.job_id)
    const painter = store.painters.find((item) => item.id === offer.painter_id)
    return { offer, job, painter }
  }

  async respondToOffer(token, decision) {
    const store = await readDemoStore()
    const offer = store.job_offers.find((item) => item.token_hash === hashToken(token))
    if (!offer) throw new Error('Nabídka nebyla nalezena.')

    const job = store.jobs.find((item) => item.id === offer.job_id)
    if (!job) throw new Error('Zakázka nebyla nalezena.')

    if (offer.status !== OFFER_STATUSES.PENDING) {
      throw new Error('Tato nabídka už není dostupná.')
    }

    if (new Date(offer.expires_at).getTime() < Date.now()) {
      offer.status = OFFER_STATUSES.EXPIRED
      offer.updated_at = nowIso()
      store.job_events.push(
        createEvent({
          jobId: job.id,
          offerId: offer.id,
          eventType: EVENT_TYPES.OFFER_EXPIRED,
          actorType: 'system',
          actorLabel: 'System',
        }),
      )
      await writeDemoStore(store)
      throw new Error('Tato nabídka už není dostupná.')
    }

    if (decision === 'accept') {
      offer.status = OFFER_STATUSES.ACCEPTED
      offer.responded_at = nowIso()
      offer.updated_at = nowIso()
      job.status = JOB_STATUSES.PAINTER_ACCEPTED
      job.selected_offer_id = offer.id
      job.selected_painter_id = offer.painter_id
      job.selected_painter_name = offer.painter_name
      job.updated_at = nowIso()
      store.job_events.push(
        createEvent({
          jobId: job.id,
          offerId: offer.id,
          eventType: EVENT_TYPES.OFFER_ACCEPTED,
          actorType: 'painter',
          actorLabel: offer.painter_name,
        }),
      )
    } else {
      offer.status = OFFER_STATUSES.DECLINED
      offer.responded_at = nowIso()
      offer.updated_at = nowIso()
      job.status = JOB_STATUSES.READY_TO_OFFER
      job.updated_at = nowIso()
      store.job_events.push(
        createEvent({
          jobId: job.id,
          offerId: offer.id,
          eventType: EVENT_TYPES.OFFER_DECLINED,
          actorType: 'painter',
          actorLabel: offer.painter_name,
        }),
      )
    }

    await writeDemoStore(store)
    return { offer, job }
  }

  async confirmAssignment(jobId, adminEmail) {
    const store = await readDemoStore()
    const job = store.jobs.find((item) => item.id === jobId)
    if (!job || !job.selected_offer_id) throw new Error('Zakázka nemá přijatou nabídku.')

    const winningOffer = store.job_offers.find((item) => item.id === job.selected_offer_id)
    if (!winningOffer || winningOffer.status !== OFFER_STATUSES.ACCEPTED) {
      throw new Error('Přijatá nabídka už není dostupná.')
    }

    for (const offer of store.job_offers.filter((item) => item.job_id === jobId && item.id !== winningOffer.id && item.status === OFFER_STATUSES.PENDING)) {
      offer.status = OFFER_STATUSES.WITHDRAWN
      offer.updated_at = nowIso()
      store.job_events.push(
        createEvent({
          jobId,
          offerId: offer.id,
          eventType: EVENT_TYPES.OFFER_WITHDRAWN,
          actorType: 'system',
          actorLabel: 'System',
          payload: { because: 'assigned_elsewhere' },
        }),
      )
    }

    job.status = JOB_STATUSES.CLIENT_CONFIRMED
    job.assigned_at = nowIso()
    job.updated_at = nowIso()
    store.job_events.push(
      createEvent({
        jobId,
        offerId: winningOffer.id,
        eventType: EVENT_TYPES.JOB_ASSIGNED,
        actorType: 'admin',
        actorLabel: adminEmail,
        payload: { painterName: winningOffer.painter_name },
      }),
      createEvent({
        jobId,
        offerId: winningOffer.id,
        eventType: EVENT_TYPES.CLIENT_ASSIGNED_NOTIFICATION_QUEUED,
        actorType: 'system',
        actorLabel: 'System',
      }),
      createEvent({
        jobId,
        offerId: winningOffer.id,
        eventType: EVENT_TYPES.PAINTER_CONTACT_UNLOCKED,
        actorType: 'system',
        actorLabel: 'System',
      }),
    )
    store.notifications.push(
      createNotification({
        job,
        offerId: winningOffer.id,
        channel: inferNotificationChannel(job),
        recipient: job.client_email || job.client_phone,
        templateKey: 'job_assigned',
        payload: { painterName: winningOffer.painter_name },
      }),
    )
    await writeDemoStore(store)
    return job
  }

  async returnToDispatch(jobId, adminEmail) {
    const store = await readDemoStore()
    const job = store.jobs.find((item) => item.id === jobId)
    if (!job) throw new Error('Zakázka nebyla nalezena.')

    job.status = JOB_STATUSES.READY_TO_OFFER
    job.selected_offer_id = null
    job.selected_painter_id = null
    job.selected_painter_name = null
    job.updated_at = nowIso()
    store.job_events.push(
      createEvent({
        jobId,
        eventType: EVENT_TYPES.JOB_RETURNED_TO_DISPATCH,
        actorType: 'admin',
        actorLabel: adminEmail,
      }),
    )
    await writeDemoStore(store)
    return job
  }

  async markJobState(jobId, adminEmail, nextStatus) {
    const store = await readDemoStore()
    const job = store.jobs.find((item) => item.id === jobId)
    if (!job) throw new Error('Zakázka nebyla nalezena.')

    job.status = nextStatus
    job.updated_at = nowIso()
    const eventType =
      nextStatus === JOB_STATUSES.IN_PROGRESS ? EVENT_TYPES.JOB_MARKED_IN_PROGRESS :
      nextStatus === JOB_STATUSES.DONE ? EVENT_TYPES.JOB_COMPLETED :
      EVENT_TYPES.JOB_REVIEWED

    store.job_events.push(
      createEvent({
        jobId,
        eventType,
        actorType: 'admin',
        actorLabel: adminEmail,
      }),
    )
    await writeDemoStore(store)
    return job
  }

  async cancelAdminJob(jobId, adminEmail) {
    const store = await readDemoStore()
    const job = store.jobs.find((item) => item.id === jobId)
    if (!job) throw new Error('Zakázka nebyla nalezena.')

    job.status = JOB_STATUSES.CANCELED
    job.updated_at = nowIso()
    for (const offer of store.job_offers.filter((item) => item.job_id === job.id && item.status === OFFER_STATUSES.PENDING)) {
      offer.status = OFFER_STATUSES.WITHDRAWN
      offer.updated_at = nowIso()
      store.job_events.push(
        createEvent({
          jobId: job.id,
          offerId: offer.id,
          eventType: EVENT_TYPES.OFFER_WITHDRAWN,
          actorType: 'system',
          actorLabel: 'System',
        }),
      )
    }
    store.job_events.push(
      createEvent({
        jobId: job.id,
        eventType: EVENT_TYPES.JOB_CANCELED,
        actorType: 'admin',
        actorLabel: adminEmail,
      }),
    )
    await writeDemoStore(store)
    return job
  }

  async getPublicJob(token) {
    const store = await readDemoStore()
    const tokenHash = hashToken(token)
    const job = store.jobs.find((item) => item.public_token_hash === tokenHash)
    if (!job) return null
    return {
      job,
      offers: store.job_offers.filter((offer) => offer.job_id === job.id),
      events: store.job_events.filter((event) => event.job_id === job.id),
    }
  }

  async completePublicJob(token, patch) {
    const store = await readDemoStore()
    const job = store.jobs.find((item) => item.public_token_hash === hashToken(token))
    if (!job) throw new Error('Zakázka nebyla nalezena.')

    job.client_name = patch.name || job.client_name
    job.client_phone = patch.phone || job.client_phone
    job.client_email = patch.email || job.client_email
    job.client_address = patch.address || job.client_address
    job.client_note = patch.notes || job.client_note
    job.status = JOB_STATUSES.WAITING_REVIEW
    job.updated_at = nowIso()
    store.job_events.push(
      createEvent({
        jobId: job.id,
        eventType: EVENT_TYPES.CLIENT_COMPLETED,
        actorType: 'client',
        actorLabel: job.client_name || 'Klient',
      }),
    )
    await writeDemoStore(store)
    return job
  }

  async cancelPublicJob(cancelToken) {
    const store = await readDemoStore()
    const job = store.jobs.find((item) => item.cancel_token_hash === hashToken(cancelToken))
    if (!job) throw new Error('Zakázka nebyla nalezena.')

    job.status = JOB_STATUSES.CANCELED
    job.updated_at = nowIso()
    for (const offer of store.job_offers.filter((item) => item.job_id === job.id && item.status === OFFER_STATUSES.PENDING)) {
      offer.status = OFFER_STATUSES.WITHDRAWN
      offer.updated_at = nowIso()
      store.job_events.push(
        createEvent({
          jobId: job.id,
          offerId: offer.id,
          eventType: EVENT_TYPES.OFFER_WITHDRAWN,
          actorType: 'system',
          actorLabel: 'System',
        }),
      )
    }
    store.job_events.push(
      createEvent({
        jobId: job.id,
        eventType: EVENT_TYPES.JOB_CANCELED,
        actorType: 'client',
        actorLabel: job.client_name || 'Klient',
      }),
    )
    await writeDemoStore(store)
    return job
  }
}

class SupabaseStore {
  constructor() {
    const { url, serviceRoleKey } = getSupabaseConfig()
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  async bootstrapAdminUser(email) {
    await this.client.from('admin_users').upsert({ email, name: 'Admin', is_active: true }, { onConflict: 'email' })
  }

  async ensurePaintersSeeded() {
    const { data } = await this.client.from('painters').select('id').limit(1)
    if (data?.length) return
    await this.client.from('painters').insert(DEFAULT_PAINTERS)
  }

  async createJob(payload, req) {
    await this.ensurePaintersSeeded()
    const job = buildJobFromPayload(payload)
    const links = decoratePublicJob(job, getAppBaseUrl(req))
    Object.assign(job, links.tokenHashes)

    const { error } = await this.client.from('jobs').insert(job)
    if (error) throw error

    await this.client.from('job_events').insert([
      createEvent({
        jobId: job.id,
        eventType: EVENT_TYPES.JOB_CREATED,
        actorType: 'client',
        actorLabel: job.client_name || 'Klient',
        payload: { reference: job.reference },
      }),
      createEvent({
        jobId: job.id,
        eventType: EVENT_TYPES.CLIENT_CONFIRMATION_QUEUED,
        actorType: 'system',
        actorLabel: 'System',
        payload: { channel: inferNotificationChannel(job) },
      }),
    ])

    await this.client.from('notifications').insert(
      createNotification({
        job,
        channel: inferNotificationChannel(job),
        recipient: job.client_email || job.client_phone,
        templateKey: 'job_received',
        payload: links,
      }),
    )

    return { job, links }
  }

  async listJobs() {
    await this.ensurePaintersSeeded()
    const { data, error } = await this.client
      .from('jobs')
      .select('*, job_offers(*), job_events(*)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data.map((item) => buildJobSummary(item, item.job_offers || [], item.job_events || []))
  }

  async getJob(jobId) {
    const { data: job, error } = await this.client.from('jobs').select('*').eq('id', jobId).single()
    if (error) return null
    const [{ data: offers }, { data: events }, { data: painters }, { data: notifications }] = await Promise.all([
      this.client.from('job_offers').select('*').eq('job_id', jobId).order('created_at', { ascending: false }),
      this.client.from('job_events').select('*').eq('job_id', jobId).order('created_at', { ascending: false }),
      this.client.from('painters').select('*').eq('is_active', true),
      this.client.from('notifications').select('*').eq('job_id', jobId).order('created_at', { ascending: false }),
    ])
    return { job, offers: offers || [], events: events || [], painters: painters || [], notifications: notifications || [] }
  }

  async getPainters() {
    await this.ensurePaintersSeeded()
    const { data, error } = await this.client.from('painters').select('*').eq('is_active', true).order('name')
    if (error) throw error
    return data || []
  }

  async requestCompletion(jobId, adminEmail, reason) {
    const { data: job, error } = await this.client
      .from('jobs')
      .update({
        status: JOB_STATUSES.WAITING_COMPLETION,
        needs_completion_reason: reason || 'Prosíme o doplnění údajů.',
        updated_at: nowIso(),
      })
      .eq('id', jobId)
      .select('*')
      .single()
    if (error) throw error

    await this.client.from('job_events').insert(
      createEvent({
        jobId,
        eventType: EVENT_TYPES.COMPLETION_REQUESTED,
        actorType: 'admin',
        actorLabel: adminEmail,
        payload: { reason: job.needs_completion_reason },
      }),
    )
    return job
  }

  async prepareJob(jobId, adminEmail, confirmedPrice, painterPayout) {
    const { data: job, error } = await this.client
      .from('jobs')
      .update({
        status: JOB_STATUSES.READY_TO_OFFER,
        confirmed_price: Number(confirmedPrice) || null,
        painter_payout: Number(painterPayout) || null,
        updated_at: nowIso(),
      })
      .eq('id', jobId)
      .select('*')
      .single()
    if (error) throw error

    await this.client.from('job_events').insert([
      createEvent({
        jobId,
        eventType: EVENT_TYPES.CLIENT_PRICE_SET,
        actorType: 'admin',
        actorLabel: adminEmail,
        payload: { confirmedPrice: job.confirmed_price },
      }),
      createEvent({
        jobId,
        eventType: EVENT_TYPES.PAINTER_PAYOUT_SET,
        actorType: 'admin',
        actorLabel: adminEmail,
        payload: { painterPayout: job.painter_payout },
      }),
    ])
    return job
  }

  async sendOffer(jobId, painterId, adminEmail, req) {
    const { data: job } = await this.client.from('jobs').select('*').eq('id', jobId).single()
    const { data: painter } = await this.client.from('painters').select('*').eq('id', painterId).single()
    const token = randomToken()
    const offer = {
      id: createId(),
      job_id: jobId,
      painter_id: painterId,
      painter_name: painter.name,
      status: OFFER_STATUSES.PENDING,
      token_hash: hashToken(token),
      offered_payout: job.painter_payout,
      approx_location: job.approximate_location,
      sanitized_note: sanitizeNote(`${job.booking_note}\n${job.client_note}`),
      expires_at: new Date(Date.now() + getOfferExpiryMinutes() * 60000).toISOString(),
      responded_at: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    }

    const { error } = await this.client.from('job_offers').insert(offer)
    if (error) throw error
    await this.client.from('jobs').update({ status: JOB_STATUSES.OFFERED, updated_at: nowIso() }).eq('id', jobId)
    await this.client.from('job_events').insert(
      createEvent({
        jobId,
        offerId: offer.id,
        eventType: EVENT_TYPES.OFFER_SENT,
        actorType: 'admin',
        actorLabel: adminEmail,
        payload: { painterName: painter.name, expiresAt: offer.expires_at },
      }),
    )
    return { job, offer, offerUrl: `${getAppBaseUrl(req)}/nabidka?token=${token}` }
  }

  async getOfferByToken(token) {
    const tokenHash = hashToken(token)
    const { data: offer, error } = await this.client.from('job_offers').select('*').eq('token_hash', tokenHash).single()
    if (error || !offer) return null
    const [{ data: job }, { data: painter }] = await Promise.all([
      this.client.from('jobs').select('*').eq('id', offer.job_id).single(),
      this.client.from('painters').select('*').eq('id', offer.painter_id).single(),
    ])
    return { offer, job, painter }
  }

  async respondToOffer(token, decision) {
    const { data, error } = await this.client.rpc('respond_to_offer', {
      offer_token: token,
      offer_decision: decision,
    })
    if (error) throw error
    return data
  }

  async confirmAssignment(jobId, adminEmail) {
    const { data, error } = await this.client.rpc('confirm_job_assignment', {
      job_id_input: jobId,
      admin_email_input: adminEmail,
    })
    if (error) throw error
    return data
  }

  async returnToDispatch(jobId, adminEmail) {
    const { data: job, error } = await this.client
      .from('jobs')
      .update({
        status: JOB_STATUSES.READY_TO_OFFER,
        selected_offer_id: null,
        selected_painter_id: null,
        selected_painter_name: null,
        updated_at: nowIso(),
      })
      .eq('id', jobId)
      .select('*')
      .single()
    if (error) throw error

    await this.client.from('job_events').insert(
      createEvent({
        jobId,
        eventType: EVENT_TYPES.JOB_RETURNED_TO_DISPATCH,
        actorType: 'admin',
        actorLabel: adminEmail,
      }),
    )
    return job
  }

  async markJobState(jobId, adminEmail, nextStatus) {
    const { data: job, error } = await this.client
      .from('jobs')
      .update({ status: nextStatus, updated_at: nowIso() })
      .eq('id', jobId)
      .select('*')
      .single()
    if (error) throw error
    const eventType =
      nextStatus === JOB_STATUSES.IN_PROGRESS ? EVENT_TYPES.JOB_MARKED_IN_PROGRESS :
      nextStatus === JOB_STATUSES.DONE ? EVENT_TYPES.JOB_COMPLETED :
      EVENT_TYPES.JOB_REVIEWED
    await this.client.from('job_events').insert(
      createEvent({
        jobId,
        eventType,
        actorType: 'admin',
        actorLabel: adminEmail,
      }),
    )
    return job
  }

  async cancelAdminJob(jobId, adminEmail) {
    const { data: job, error } = await this.client
      .from('jobs')
      .update({ status: JOB_STATUSES.CANCELED, updated_at: nowIso() })
      .eq('id', jobId)
      .select('*')
      .single()
    if (error) throw error

    await this.client
      .from('job_offers')
      .update({ status: OFFER_STATUSES.WITHDRAWN, updated_at: nowIso() })
      .eq('job_id', jobId)
      .eq('status', OFFER_STATUSES.PENDING)

    await this.client.from('job_events').insert(
      createEvent({
        jobId,
        eventType: EVENT_TYPES.JOB_CANCELED,
        actorType: 'admin',
        actorLabel: adminEmail,
      }),
    )
    return job
  }

  async getPublicJob(token) {
    const tokenHash = hashToken(token)
    const { data: job, error } = await this.client.from('jobs').select('*').eq('public_token_hash', tokenHash).single()
    if (error || !job) return null
    const [{ data: offers }, { data: events }] = await Promise.all([
      this.client.from('job_offers').select('*').eq('job_id', job.id).order('created_at', { ascending: false }),
      this.client.from('job_events').select('*').eq('job_id', job.id).order('created_at', { ascending: false }),
    ])
    return { job, offers: offers || [], events: events || [] }
  }

  async completePublicJob(token, patch) {
    const tokenHash = hashToken(token)
    const { data: job, error } = await this.client
      .from('jobs')
      .update({
        client_name: patch.name,
        client_phone: patch.phone,
        client_email: patch.email,
        client_address: patch.address,
        client_note: patch.notes,
        status: JOB_STATUSES.WAITING_REVIEW,
        updated_at: nowIso(),
      })
      .eq('public_token_hash', tokenHash)
      .select('*')
      .single()
    if (error) throw error
    await this.client.from('job_events').insert(
      createEvent({
        jobId: job.id,
        eventType: EVENT_TYPES.CLIENT_COMPLETED,
        actorType: 'client',
        actorLabel: job.client_name || 'Klient',
      }),
    )
    return job
  }

  async cancelPublicJob(cancelToken) {
    const { data, error } = await this.client.rpc('cancel_public_job', {
      cancel_token: cancelToken,
    })
    if (error) throw error
    return data
  }
}

let cachedStore = null

export function getStore() {
  if (cachedStore) return cachedStore
  cachedStore = hasSupabaseConfig() ? new SupabaseStore() : new DemoStore()
  return cachedStore
}
