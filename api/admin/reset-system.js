import { requireAdmin } from '../../lib/server/auth.js'
import { readJsonBody, sendJson, sendMethodNotAllowed } from '../../lib/server/http.js'
import { getStore } from '../../lib/server/store.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])
  const admin = requireAdmin(req)
  if (!admin) return sendJson(res, 401, { error: 'Unauthorized' })

  try {
    const body = await readJsonBody(req)
    if (body?.confirm !== 'RESET_ALL_DATA') {
      return sendJson(res, 400, { error: 'Chybí potvrzení resetu.' })
    }
    const result = await getStore().resetSystem(admin.email)
    return sendJson(res, 200, { ok: true, result })
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Reset systému se nepodařil.' })
  }
}
