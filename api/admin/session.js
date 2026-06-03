import { requireAdmin } from '../../lib/server/auth.js'
import { sendJson, sendMethodNotAllowed } from '../../lib/server/http.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendMethodNotAllowed(res, ['GET'])
  const admin = requireAdmin(req)
  if (!admin) return sendJson(res, 200, { authenticated: false })
  return sendJson(res, 200, { authenticated: true, admin })
}
