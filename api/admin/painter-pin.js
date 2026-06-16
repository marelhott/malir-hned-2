import { requireAdmin } from '../../lib/server/auth.js'
import { readJsonBody, sendJson, sendMethodNotAllowed } from '../../lib/server/http.js'
import { getStore } from '../../lib/server/store.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])
  const admin = requireAdmin(req)
  if (!admin) return sendJson(res, 401, { error: 'Unauthorized' })

  try {
    const body = await readJsonBody(req)
    const painterId = body.painterId
    const pin = String(body.pin || '').trim()
    if (!painterId || !pin) return sendJson(res, 400, { error: 'Chybí painterId nebo PIN.' })
    const result = await getStore().setPainterPin(painterId, pin, admin.email)
    return sendJson(res, 200, { ok: true, result })
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'PIN malíře se nepodařilo uložit.' })
  }
}
