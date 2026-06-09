import { sendJson, sendMethodNotAllowed, readJsonBody } from '../../lib/server/http.js'
import { getStore } from '../../lib/server/store.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  try {
    const body = await readJsonBody(req)
    let token = body.token
    if (!token && body.painterName) {
      const state = await getStore().readState()
      const painter = state.painters.find(p => p.name.toLowerCase() === body.painterName.toLowerCase())
      if (!painter) return sendJson(res, 404, { error: 'Malíř nebyl nalezen.' })
      token = painter.portal_access_token
    }
    const result = await getStore().updatePainterAvailability(token, body)
    return sendJson(res, 200, { ok: true, ...result })
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Dostupnost se nepodařilo uložit.' })
  }
}
