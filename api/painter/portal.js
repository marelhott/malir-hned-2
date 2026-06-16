import { requirePainterSession } from '../../lib/server/auth.js'
import { sendJson, sendMethodNotAllowed, getQuery } from '../../lib/server/http.js'
import { getStore } from '../../lib/server/store.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendMethodNotAllowed(res, ['GET'])

  try {
    const { slug } = getQuery(req)
    const session = requirePainterSession(req)
    if (!session) {
      if (!slug) return sendJson(res, 401, { error: 'Přihlášení malíře vyžaduje PIN.' })
      const basic = await getStore().getPainterPortalBySlug(slug)
      if (!basic) return sendJson(res, 404, { error: 'Malířský portál nebyl nalezen.' })
      return sendJson(res, 401, { error: 'Přihlášení malíře vyžaduje PIN.', ...basic })
    }
    const result = await getStore().getPainterPortalBySession(session.painterId, session.sessionVersion)
    if (!result) return sendJson(res, 401, { error: 'Relace malíře vypršela. Přihlaste se znovu pomocí PINu.' })
    return sendJson(res, 200, result)
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Malířský portál se nepodařilo načíst.' })
  }
}
