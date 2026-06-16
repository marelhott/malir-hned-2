import {
  clearPainterLoginFailures,
  createPainterCookie,
  getPainterLoginLock,
  recordPainterLoginFailure,
} from '../../lib/server/auth.js'
import { readJsonBody, sendJson, sendMethodNotAllowed } from '../../lib/server/http.js'
import { getStore } from '../../lib/server/store.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  try {
    const body = await readJsonBody(req)
    const slug = String(body.slug || '').trim()
    const pin = String(body.pin || '').trim()
    if (!slug || !pin) return sendJson(res, 400, { error: 'Chybí jméno malíře nebo PIN.' })

    const lock = getPainterLoginLock(req, slug)
    if (lock.isLocked) {
      return sendJson(res, 429, {
        error: 'Příliš mnoho neúspěšných pokusů. Zkuste to prosím znovu později.',
        retryAfterSeconds: Math.ceil(lock.retryAfterMs / 1000),
      })
    }

    const result = await getStore().authenticatePainterByPin(slug, pin)
    if (!result?.ok) {
      const failure = recordPainterLoginFailure(req, slug)
      return sendJson(res, failure.isLocked ? 429 : 401, {
        error: failure.isLocked
          ? 'Příliš mnoho neúspěšných pokusů. Zkuste to prosím znovu později.'
          : 'Neplatný PIN.',
        attemptsRemaining: failure.attemptsRemaining,
        retryAfterSeconds: failure.isLocked ? Math.ceil(failure.retryAfterMs / 1000) : 0,
      })
    }

    clearPainterLoginFailures(req, slug)
    const portal = await getStore().getPainterPortalBySession(result.painter.id, result.sessionVersion)
    return sendJson(res, 200, { ok: true, ...portal }, {
      'Set-Cookie': createPainterCookie(result.painter.id, result.sessionVersion),
    })
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Přihlášení malíře se nepodařilo.' })
  }
}
