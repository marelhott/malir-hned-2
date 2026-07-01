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

function assertValidPrice(value) {
  if (value == null || value === '') return
  if (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 1000000) {
    throw new Error('Orientační cena má neplatný formát.')
  }
}

export function validatePublicJobPayload(payload) {
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

  assertValidPrice(booking.priceLow)
  assertValidPrice(booking.priceHigh)
}

export function validatePublicJobCompletionPatch(patch) {
  const token = trimText(patch?.token, 240)
  const name = trimText(patch?.name, 120)
  const phone = trimText(patch?.phone, 40)
  const email = trimText(patch?.email, 160)
  const address = trimText(patch?.address, 240)
  const notes = trimText(patch?.notes, 4000)

  if (!token) throw new Error('Chybí token zakázky.')
  if (!name) throw new Error('Vyplňte prosím jméno.')
  if (!phone && !email) throw new Error('Vyplňte prosím telefon nebo e-mail.')
  if (phone && !isValidPhone(phone)) throw new Error('Zadejte prosím platné telefonní číslo.')
  if (email && !isValidEmail(email)) throw new Error('Zadejte prosím platný e-mail.')
  if (!address) throw new Error('Vyplňte prosím přesnou adresu.')

  return { token, name, phone, email, address, notes }
}
