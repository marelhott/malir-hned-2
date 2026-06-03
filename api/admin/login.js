import { createAdminCookie, validateAdminCredentials } from '../../lib/server/auth.js'
import { sendJson, sendMethodNotAllowed, readJsonBody } from '../../lib/server/http.js'
import { getStore } from '../../lib/server/store.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  try {
    const body = await readJsonBody(req)
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')

    if (!validateAdminCredentials(email, password)) {
      return sendJson(res, 401, { error: 'Neplatné přihlašovací údaje.' })
    }

    await getStore().bootstrapAdminUser(email)

    return sendJson(
      res,
      200,
      { ok: true, email },
      { 'Set-Cookie': createAdminCookie(email) },
    )
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Přihlášení se nepodařilo.' })
  }
}
