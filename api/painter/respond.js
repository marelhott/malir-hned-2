import { requirePainterSession } from '../../lib/server/auth.js'
import { sendJson, sendMethodNotAllowed, readJsonBody } from '../../lib/server/http.js'
import { getStore } from '../../lib/server/store.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  try {
    const session = requirePainterSession(req)
    if (!session) return sendJson(res, 401, { error: 'Přihlášení malíře vypršelo. Přihlaste se znovu pomocí PINu.' })
    const auth = await getStore().getPainterSessionState(session.painterId, session.sessionVersion)
    if (!auth) return sendJson(res, 401, { error: 'Přihlášení malíře vypršelo. Přihlaste se znovu pomocí PINu.' })
    if (auth.mustChangePin) return sendJson(res, 403, { error: 'Nejdřív si nastavte vlastní PIN.' })
    const body = await readJsonBody(req)
    if (!body.offerId) return sendJson(res, 400, { error: 'Chybí offerId.' })
    const result = await getStore().respondToOfferByPainterId(session.painterId, body.offerId, body.decision, body.estimatedDays)
    return sendJson(res, 200, { ok: true, result })
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Reakci se nepodařilo uložit.' })
  }
}
