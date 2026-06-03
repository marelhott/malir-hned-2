import { requireAdmin } from '../../lib/server/auth.js'
import { sendJson, sendMethodNotAllowed } from '../../lib/server/http.js'
import { getStore } from '../../lib/server/store.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendMethodNotAllowed(res, ['GET'])
  const admin = requireAdmin(req)
  if (!admin) return sendJson(res, 401, { error: 'Unauthorized' })

  try {
    const jobs = await getStore().listJobs()
    return sendJson(res, 200, { jobs })
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Zakázky se nepodařilo načíst.' })
  }
}
