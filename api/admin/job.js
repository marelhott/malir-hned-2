import { requireAdmin } from '../../lib/server/auth.js'
import { sendJson, sendMethodNotAllowed, getQuery } from '../../lib/server/http.js'
import { getStore } from '../../lib/server/store.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendMethodNotAllowed(res, ['GET'])
  const admin = requireAdmin(req)
  if (!admin) return sendJson(res, 401, { error: 'Unauthorized' })

  try {
    const { id } = getQuery(req)
    const result = await getStore().getJob(id)
    if (!result) return sendJson(res, 404, { error: 'Zakázka nebyla nalezena.' })
    return sendJson(res, 200, result)
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Detail zakázky se nepodařilo načíst.' })
  }
}
