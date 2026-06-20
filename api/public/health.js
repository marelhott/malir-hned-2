import { sendJson, sendMethodNotAllowed } from '../../lib/server/http.js'
import { getStore } from '../../lib/server/store.js'
import { hasSupabaseConfig } from '../../lib/server/config.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return sendMethodNotAllowed(res, ['GET'])

  const storeType = hasSupabaseConfig() ? 'supabase-db' : 'disabled'

  try {
    const store = getStore()
    // Lightweight connectivity probe — just fetch one painter row
    const state = await store.readState()
    const painterCount = (state.painters || []).filter((p) => p.is_active).length
    return sendJson(res, 200, {
      ok: true,
      store: storeType,
      painters: painterCount,
    })
  } catch (error) {
    return sendJson(res, 503, {
      ok: false,
      store: storeType,
      error: error.message,
    })
  }
}
