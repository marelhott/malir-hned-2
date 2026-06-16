import { EventEmitter } from 'node:events'
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const dataDir = path.join(rootDir, '.data')
const dataFile = path.join(dataDir, 'demo-store.json')
const backupFile = path.join(dataDir, 'demo-store.verify-backup.json')

process.env.APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000'
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@test.local'
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'demo1234'
process.env.ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'test-secret'
process.env.CRON_SECRET = process.env.CRON_SECRET || 'cron-secret'
delete process.env.SUPABASE_URL
delete process.env.SUPABASE_SERVICE_ROLE_KEY
delete process.env.VERCEL_ENV
delete process.env.NODE_ENV

const { getStore } = await import('../lib/server/store.js')
const publicJobsHandler = (await import('../api/public/jobs.js')).default
const painterByNameHandler = (await import('../api/painter/by-name.js')).default
const painterAvailabilityHandler = (await import('../api/painter/availability.js')).default
const painterPushSubscribeHandler = (await import('../api/painter/push-subscribe.js')).default
const expireOffersHandler = (await import('../api/cron/expire-offers.js')).default

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

async function backupDemoStore() {
  await mkdir(dataDir, { recursive: true })
  try {
    await copyFile(dataFile, backupFile)
  } catch {
    await rm(backupFile, { force: true })
  }
  await rm(dataFile, { force: true })
}

async function restoreDemoStore() {
  try {
    const backup = await readFile(backupFile, 'utf8')
    await writeFile(dataFile, backup, 'utf8')
    await rm(backupFile, { force: true })
  } catch {
    await rm(dataFile, { force: true })
  }
}

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    writeHead(status, headers) {
      this.statusCode = status
      this.headers = { ...this.headers, ...headers }
    },
    end(chunk = '') {
      this.body += chunk
    },
  }
}

async function invokeJsonHandler(handler, { method = 'GET', url = '/', headers = {}, body = null } = {}) {
  const req = new EventEmitter()
  req.method = method
  req.url = url
  req.headers = headers
  req.on = req.addListener.bind(req)

  const res = createMockRes()
  const promise = handler(req, res)

  queueMicrotask(() => {
    if (body != null) {
      req.emit('data', typeof body === 'string' ? body : JSON.stringify(body))
    }
    req.emit('end')
  })

  await promise
  return {
    statusCode: res.statusCode,
    headers: res.headers,
    json: res.body ? JSON.parse(res.body) : null,
  }
}

async function createJobViaPublicApi(store, preferredDate, label) {
  const payload = {
    submittedAt: new Date().toISOString(),
    customer: {
      name: `${label} Klient`,
      phone: '+420777123456',
      email: 'verify@example.com',
      address: 'Korunní 120, Praha 10',
      city: 'Praha',
      notes: `${label} poznámka klienta`,
    },
    booking: {
      preferredDate,
      dateLabel: preferredDate,
      preferredTime: 'Celý den',
      workType: 'Běžná bílá výmalba',
      propertyType: 'Byt',
      roomCount: 2,
      squareMeters: 55,
      notes: `${label} poznámka rezervace`,
      priceLow: 12000,
      priceHigh: 15000,
    },
  }

  const result = await invokeJsonHandler(publicJobsHandler, {
    method: 'POST',
    url: '/api/public/jobs',
    headers: { host: 'localhost:3000', 'x-forwarded-proto': 'http' },
    body: payload,
  })

  assert(result.statusCode === 200, `${label}: vytvoření veřejné zakázky selhalo`)
  assert(result.json?.ok === true, `${label}: API nevrátilo ok=true`)
  const jobs = await store.listJobs()
  const job = jobs.find((item) => item.reference === result.json.reference)
  assert(job, `${label}: nově vytvořená zakázka se nenašla ve store.`)
  return job
}

async function findAvailableStartDate(store, painterId, excludedDates = new Set()) {
  const portal = await store.getPainterPortal(painterId)
  const startRow = portal.availability.find((row) => {
    if (row.status !== 'available') return false
    if (excludedDates.has(row.date)) return false
    const nextDate = addDays(row.date, 1)
    return !excludedDates.has(nextDate)
  })
  assert(startRow, 'Nepodařilo se najít volný termín pro test.')
  return startRow.date
}

async function seedPainterAvailability(store, painterId, startDate, days = 45) {
  const entries = []
  for (let offset = 0; offset < days; offset += 1) {
    const date = addDays(startDate, offset)
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()
    entries.push({
      date,
      status: weekday === 0 ? 'unavailable' : weekday === 6 ? 'limited' : 'available',
      capacity: weekday === 0 ? 0 : 1,
      accepts_express: false,
      note: '',
      source: 'verify',
    })
  }
  await store.updatePainterAvailabilityByPainterId(painterId, { entries })
}

async function main() {
  await backupDemoStore()
  try {
    const store = getStore()
    const painters = await store.getPainters()
    assert(painters.length > 0, 'V seed datech chybí malíři.')
    const painter = painters[0]
    await seedPainterAvailability(store, painter.id, todayIso(), 60)

    const usedDates = new Set()

    const confirmedStart = await findAvailableStartDate(store, painter.id, usedDates)
    usedDates.add(confirmedStart)
    usedDates.add(addDays(confirmedStart, 1))
    usedDates.add(addDays(confirmedStart, 2))

    const confirmedJob = await createJobViaPublicApi(store, confirmedStart, 'Potvrzena')
    await store.prepareJob(confirmedJob.id, process.env.ADMIN_EMAIL, 14500, 9000)
    const sentOffer = await store.sendOffer(confirmedJob.id, painter.id, process.env.ADMIN_EMAIL, {
      headers: { host: 'localhost:3000', 'x-forwarded-proto': 'http' },
    }, 3)

    const pendingPortal = await store.getPainterPortal(painter.id)
    const pendingOffer = pendingPortal.offers.find((offer) => offer.id === sentOffer.offer.id)
    assert(pendingOffer?.status === 'pending', 'Nabídka se malíři nepropsala jako pending.')
    assert(pendingOffer.job?.contact_locked === true, 'Kontakt klienta nesmí být odemčen před potvrzením.')

    for (const date of [confirmedStart, addDays(confirmedStart, 1), addDays(confirmedStart, 2)]) {
      const adminDay = await store.getAdminAvailabilityCalendar({ date, jobId: confirmedJob.id })
      const dayPainter = adminDay.selected_day?.painters?.find((item) => item.id === painter.id)
      assert(dayPainter?.temporary_holds === 1, `Dispečerský kalendář neukazuje temporary hold pro ${date}.`)

      const portalDay = (await store.getPainterPortal(painter.id)).availability.find((row) => row.date === date)
      assert(portalDay?.status === 'unavailable', `Portál malíře neukazuje blokaci pro ${date}.`)
      assert((portalDay?.temporary_holds || 0) === 1, `Portál malíře neukazuje temporary hold pro ${date}.`)
    }

    await store.respondToOfferByPainterId(painter.id, sentOffer.offer.id, 'accept', 3)
    const acceptedPortal = await store.getPainterPortal(painter.id)
    const acceptedJob = acceptedPortal.jobs.find((job) => job.id === confirmedJob.id)
    assert(acceptedJob?.status === 'painter_accepted', 'Po přijetí se zakázka nepřesunula do seznamu zakázek malíře.')
    assert(acceptedJob?.contact_locked === true, 'Kontakt klienta se odemkl příliš brzy po přijetí nabídky.')

    await store.confirmAssignment(confirmedJob.id, process.env.ADMIN_EMAIL)
    const confirmedPortal = await store.getPainterPortal(painter.id)
    const finalJob = confirmedPortal.jobs.find((job) => job.id === confirmedJob.id)
    assert(finalJob?.status === 'confirmed_to_client', 'Po potvrzení dispečerem nemá zakázka finální stav.')
    assert(finalJob?.contact_locked !== true, 'Kontakt klienta zůstal zamčený i po potvrzení dispečerem.')
    assert(finalJob?.client_phone, 'Malíř po potvrzení stále nevidí kontakt na klienta.')

    for (const date of [confirmedStart, addDays(confirmedStart, 1), addDays(confirmedStart, 2)]) {
      const portalDay = (await store.getPainterPortal(painter.id)).availability.find((row) => row.date === date)
      assert((portalDay?.confirmed_blocks || 0) === 1, `Potvrzený blok se nepropsal do portálu pro ${date}.`)
      assert((portalDay?.temporary_holds || 0) === 0, `Temporary hold zůstal viset i po potvrzení pro ${date}.`)
    }

    await store.cancelAdminJob(confirmedJob.id, process.env.ADMIN_EMAIL)
    const cancelledPortal = await store.getPainterPortal(painter.id)
    const cancelledJob = cancelledPortal.jobs.find((job) => job.id === confirmedJob.id)
    assert(!cancelledJob, 'Po zrušení potvrzené zakázky zůstala zakázka v seznamu malíře.')
    const cancelledState = await store.getJob(confirmedJob.id)
    assert(cancelledState?.job?.status === 'cancelled', 'Po admin zrušení potvrzené zakázky není finální stav cancelled.')
    assert(cancelledState?.job?.assigned_painter_id == null, 'Po admin zrušení potvrzené zakázky zůstal assigned_painter_id vyplněný.')
    assert(cancelledState?.job?.selected_painter_id == null, 'Po admin zrušení potvrzené zakázky zůstal selected_painter_id vyplněný.')
    assert(cancelledState?.job?.selected_offer_id == null, 'Po admin zrušení potvrzené zakázky zůstal selected_offer_id vyplněný.')
    for (const date of [confirmedStart, addDays(confirmedStart, 1), addDays(confirmedStart, 2)]) {
      const portalDay = (await store.getPainterPortal(painter.id)).availability.find((row) => row.date === date)
      assert((portalDay?.confirmed_blocks || 0) === 0, `Po zrušení potvrzené zakázky zůstal confirmed block v portálu pro ${date}.`)
    }

    const declinedStart = await findAvailableStartDate(store, painter.id, usedDates)
    usedDates.add(declinedStart)
    const declinedJob = await createJobViaPublicApi(store, declinedStart, 'Odmítnuta')
    await store.prepareJob(declinedJob.id, process.env.ADMIN_EMAIL, 11000, 7000)
    const declinedOffer = await store.sendOffer(declinedJob.id, painter.id, process.env.ADMIN_EMAIL, {
      headers: { host: 'localhost:3000', 'x-forwarded-proto': 'http' },
    }, 1)
    await store.respondToOfferByPainterId(painter.id, declinedOffer.offer.id, 'decline', 1)

    const declinedPortalDay = (await store.getPainterPortal(painter.id)).availability.find((row) => row.date === declinedStart)
    assert(declinedPortalDay?.status !== 'unavailable' || (declinedPortalDay?.confirmed_blocks || 0) === 0, 'Po odmítnutí zůstal den zablokovaný.')
    assert((declinedPortalDay?.temporary_holds || 0) === 0, 'Po odmítnutí zůstal temporary hold aktivní.')

    const declinedJobState = await store.getJob(declinedJob.id)
    assert(declinedJobState?.job?.status === 'ready_to_offer', 'Po odmítnutí se zakázka nevrátila do ready_to_offer.')

    const expiredStart = await findAvailableStartDate(store, painter.id, usedDates)
    const expiredJob = await createJobViaPublicApi(store, expiredStart, 'Prošla')
    await store.prepareJob(expiredJob.id, process.env.ADMIN_EMAIL, 13000, 8000)
    const expiredOffer = await store.sendOffer(expiredJob.id, painter.id, process.env.ADMIN_EMAIL, {
      headers: { host: 'localhost:3000', 'x-forwarded-proto': 'http' },
    }, 1)

    const state = await store.readState()
    const offerRow = state.job_offers.find((offer) => offer.id === expiredOffer.offer.id)
    assert(offerRow, 'Testovací expirovaná nabídka nebyla nalezena.')
    offerRow.expires_at = new Date(Date.now() - 60_000).toISOString()
    const jobRow = state.jobs.find((job) => job.id === expiredJob.id)
    jobRow.status = 'offered_to_painter'
    await store.writeState(state)

    const cronResult = await invokeJsonHandler(expireOffersHandler, {
      method: 'GET',
      url: '/api/cron/expire-offers',
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    })
    assert(cronResult.statusCode === 200, 'Cron expire-offers nevrátil 200.')
    assert((cronResult.json?.expired || 0) >= 1, 'Cron neoznačil expirovanou nabídku.')

    const expiredJobState = await store.getJob(expiredJob.id)
    assert(expiredJobState?.job?.status === 'ready_to_offer', 'Cron nevrátil expirovanou zakázku do ready_to_offer.')
    const expiredPortalDay = (await store.getPainterPortal(painter.id)).availability.find((row) => row.date === expiredStart)
    assert((expiredPortalDay?.temporary_holds || 0) === 0, 'Cron neuvolnil temporary hold po expiraci nabídky.')

    const byNameResult = await invokeJsonHandler(painterByNameHandler, {
      method: 'GET',
      url: '/api/painter/by-name?name=marek',
      headers: {},
    })
    assert(byNameResult.statusCode === 410, 'Endpoint by-name už musí být vypnutý (410).')

    const availabilityResult = await invokeJsonHandler(painterAvailabilityHandler, {
      method: 'POST',
      url: '/api/painter/availability',
      headers: { 'content-type': 'application/json' },
      body: { entries: [{ date: confirmedStart, status: 'available' }] },
    })
    assert(availabilityResult.statusCode === 401, 'Painter availability bez tokenu musí vracet 401.')

    const pushResult = await invokeJsonHandler(painterPushSubscribeHandler, {
      method: 'POST',
      url: '/api/painter/push-subscribe',
      headers: { 'content-type': 'application/json' },
      body: { subscription: { endpoint: 'https://example.com/push/test' } },
    })
    assert(pushResult.statusCode === 401, 'Push subscribe bez tokenu musí vracet 401.')

    console.log('VERIFY_OK')
    console.log(JSON.stringify({
      painter: painter.name,
      confirmedJobId: confirmedJob.id,
      declinedJobId: declinedJob.id,
      expiredJobId: expiredJob.id,
      confirmedStart,
      declinedStart,
      expiredStart,
    }, null, 2))
  } finally {
    await restoreDemoStore()
  }
}

await main()
