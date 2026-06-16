import { requirePainterSession } from '../../lib/server/auth.js'
import { sendJson, sendMethodNotAllowed, readJsonBody } from '../../lib/server/http.js'
import { getStore } from '../../lib/server/store.js'
import { storePushSubscription } from '../../lib/server/push.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  try {
    const session = requirePainterSession(req)
    if (!session) return sendJson(res, 401, { error: 'Přihlášení malíře vypršelo. Přihlaste se znovu pomocí PINu.' })
    const body = await readJsonBody(req)
    const { subscription } = body
    if (!subscription?.endpoint) return sendJson(res, 400, { error: 'Chybí subscription.' })

    const state = await getStore().readState()
    const painter = state.painters.find((p) => p.id === session.painterId && p.portal_access_token === session.sessionVersion)
    if (!painter) return sendJson(res, 404, { error: 'Malíř nebyl nalezen.' })

    await storePushSubscription(painter.id, subscription)
    return sendJson(res, 200, { ok: true })
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Subscription se nepodařilo uložit.' })
  }
}
