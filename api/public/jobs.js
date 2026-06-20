import { sendJson, sendMethodNotAllowed, readJsonBody } from '../../lib/server/http.js'
import { getPublicJobRateLimit, recordPublicJobAttempt } from '../../lib/server/auth.js'
import { getStore } from '../../lib/server/store.js'

function trimText(value, max = 5000) {
  return String(value || '').trim().slice(0, max)
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidPhone(phone) {
  return String(phone || '').replace(/\D/g, '').length >= 9
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))
}

function validatePayload(payload) {
  const customer = payload?.customer || {}
  const booking = payload?.booking || {}

  const name = trimText(customer.name, 120)
  const phone = trimText(customer.phone, 40)
  const email = trimText(customer.email, 160)
  const address = trimText(customer.address, 240)
  const preferredDate = trimText(booking.preferredDate || booking.date, 20)
  const workType = trimText(booking.workType, 120)

  if (!name) throw new Error('Vyplňte prosím jméno.')
  if (!phone && !email) throw new Error('Vyplňte prosím telefon nebo e-mail.')
  if (phone && !isValidPhone(phone)) throw new Error('Zadejte prosím platné telefonní číslo.')
  if (email && !isValidEmail(email)) throw new Error('Zadejte prosím platný e-mail.')
  if (!address) throw new Error('Vyplňte prosím přesnou adresu.')
  if (!preferredDate || !isIsoDate(preferredDate)) throw new Error('Chybí platný preferovaný termín.')
  if (!workType) throw new Error('Chybí typ práce.')

  const priceLow = booking.priceLow
  const priceHigh = booking.priceHigh
  for (const value of [priceLow, priceHigh]) {
    if (value == null || value === '') continue
    if (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 1000000) {
      throw new Error('Orientační cena má neplatný formát.')
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  try {
    const limit = getPublicJobRateLimit(req)
    if (limit.isLimited) {
      return sendJson(res, 429, {
        error: 'Příliš mnoho pokusů o odeslání. Zkuste to prosím znovu později.',
        retryAfterSeconds: Math.ceil(limit.retryAfterMs / 1000),
      })
    }

    const payload = await readJsonBody(req)
    recordPublicJobAttempt(req)
    validatePayload(payload)
    const result = await getStore().createJob(payload, req)
    return sendJson(res, 200, {
      ok: true,
      reference: result.job.reference,
      status: result.job.status,
      publicUrl: result.links.publicUrl,
      cancelUrl: result.links.cancelUrl,
    })
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Zakázku se nepodařilo vytvořit.' })
  }
}
