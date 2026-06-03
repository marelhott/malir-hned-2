import { sendJson, sendMethodNotAllowed, readJsonBody } from '../../lib/server/http.js'
import { getStore } from '../../lib/server/store.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  try {
    const body = await readJsonBody(req)
    const result = await getStore().updatePainterAvailability(body.token, body.entries)
    return sendJson(res, 200, { ok: true, ...result })
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Dostupnost se nepodařilo uložit.' })
  }
}
