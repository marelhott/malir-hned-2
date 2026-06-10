import { sendJson, sendMethodNotAllowed } from '../../lib/server/http.js'

export default function handler(req, res) {
  if (req.method !== 'GET') return sendMethodNotAllowed(res, ['GET'])
  const publicKey = process.env.VAPID_PUBLIC_KEY || ''
  if (!publicKey) return sendJson(res, 503, { error: 'Push notifikace nejsou nakonfigurovány.' })
  return sendJson(res, 200, { publicKey })
}
