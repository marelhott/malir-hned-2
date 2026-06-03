import { sendJson, sendMethodNotAllowed, getQuery } from '../../lib/server/http.js'
import { getStore } from '../../lib/server/store.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendMethodNotAllowed(res, ['GET'])

  try {
    const query = getQuery(req)
    const result = await getStore().getPublicAvailabilityCalendar(query)
    return sendJson(res, 200, result)
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Kalendář dostupnosti se nepodařilo načíst.' })
  }
}
