import { clearAdminCookie } from '../../lib/server/auth.js'
import { sendJson, sendMethodNotAllowed } from '../../lib/server/http.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])
  return sendJson(res, 200, { ok: true }, { 'Set-Cookie': clearAdminCookie() })
}
