import { sendJson, sendMethodNotAllowed, getQuery } from '../../lib/server/http.js'
import { getStore } from '../../lib/server/store.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendMethodNotAllowed(res, ['GET'])

  try {
    const { token } = getQuery(req)
    const result = await getStore().getPainterPortal(token)
    if (!result) return sendJson(res, 404, { error: 'Malířský portál nebyl nalezen.' })
    return sendJson(res, 200, result)
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Malířský portál se nepodařilo načíst.' })
  }
}
