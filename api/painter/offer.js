import { sendJson, sendMethodNotAllowed, getQuery } from '../../lib/server/http.js'
import { getStore } from '../../lib/server/store.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendMethodNotAllowed(res, ['GET'])

  try {
    const { token } = getQuery(req)
    const result = await getStore().getOfferByToken(token)
    if (!result) return sendJson(res, 404, { error: 'Tato nabídka už není dostupná.' })
    return sendJson(res, 200, result)
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Nabídku se nepodařilo načíst.' })
  }
}
