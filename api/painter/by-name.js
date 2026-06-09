import { sendJson, sendMethodNotAllowed, getQuery } from '../../lib/server/http.js'
import { getStore } from '../../lib/server/store.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendMethodNotAllowed(res, ['GET'])

  try {
    const { name } = getQuery(req)
    if (!name) return sendJson(res, 400, { error: 'Chybí jméno malíře.' })

    const state = await getStore().readState()
    const painter = state.painters.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    )
    if (!painter) return sendJson(res, 404, { error: 'Malíř nebyl nalezen.' })

    // Reuse getPainterPortal with the painter's token
    const result = await getStore().getPainterPortal(painter.portal_access_token)
    if (!result) return sendJson(res, 404, { error: 'Portál malíře se nepodařilo načíst.' })

    return sendJson(res, 200, result)
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Nepodařilo se načíst profil malíře.' })
  }
}
