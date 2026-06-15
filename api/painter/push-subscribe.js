import { sendJson, sendMethodNotAllowed, readJsonBody, getQuery } from '../../lib/server/http.js'
import { getStore } from '../../lib/server/store.js'
import { storePushSubscription } from '../../lib/server/push.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  try {
    const body = await readJsonBody(req)
    const { subscription, token } = body
    if (!subscription?.endpoint) return sendJson(res, 400, { error: 'Chybí subscription.' })
    if (!token) return sendJson(res, 401, { error: 'Chybí přístupový token malíře.' })

    const state = await getStore().readState()
    const crypto = await import('node:crypto')
    const hash = crypto.createHash('sha256').update(token).digest('hex')
    const painter = state.painters.find((p) => p.portal_token_hash === hash)
    if (!painter) return sendJson(res, 404, { error: 'Malíř nebyl nalezen.' })

    await storePushSubscription(painter.id, subscription)
    return sendJson(res, 200, { ok: true })
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Subscription se nepodařilo uložit.' })
  }
}
