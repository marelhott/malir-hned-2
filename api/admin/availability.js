import { requireAdmin } from '../../lib/server/auth.js'
import { getQuery, readJsonBody, sendJson, sendMethodNotAllowed } from '../../lib/server/http.js'
import { getStore } from '../../lib/server/store.js'

export default async function handler(req, res) {
  const admin = requireAdmin(req)
  if (!admin) return sendJson(res, 401, { error: 'Unauthorized' })

  try {
    if (req.method === 'GET') {
      const query = getQuery(req)
      const result = await getStore().getAdminAvailabilityCalendar(query)
      return sendJson(res, 200, result)
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req)
      const result = await getStore().adminUpdatePainterAvailability(body.painterId, body, admin.email)
      return sendJson(res, 200, { ok: true, ...result })
    }

    return sendMethodNotAllowed(res, ['GET', 'POST'])
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Kalendář dostupnosti se nepodařilo zpracovat.' })
  }
}
