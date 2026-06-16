import { createPainterCookie, requirePainterSession } from '../../lib/server/auth.js'
import { readJsonBody, sendJson, sendMethodNotAllowed } from '../../lib/server/http.js'
import { getStore } from '../../lib/server/store.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  try {
    const session = requirePainterSession(req)
    if (!session) return sendJson(res, 401, { error: 'Přihlášení malíře vypršelo. Přihlaste se znovu pomocí PINu.' })

    const body = await readJsonBody(req)
    const newPin = String(body.newPin || '').trim()
    const confirmPin = String(body.confirmPin || '').trim()
    if (!newPin || !confirmPin) return sendJson(res, 400, { error: 'Vyplňte nový PIN i jeho potvrzení.' })
    if (newPin !== confirmPin) return sendJson(res, 400, { error: 'PINy se neshodují.' })

    const result = await getStore().changePainterPinBySession(session.painterId, session.sessionVersion, newPin)
    const portal = await getStore().getPainterPortalBySession(result.painter.id, result.sessionVersion)
    return sendJson(res, 200, { ok: true, ...portal }, {
      'Set-Cookie': createPainterCookie(result.painter.id, result.sessionVersion),
    })
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Změna PINu se nepodařila.' })
  }
}
