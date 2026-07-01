/**
 * Vercel Cron: runs every 5 minutes.
 * Expires pending offers past their expires_at,
 * resets job back to ready_to_offer so admin can re-offer.
 */
import { sendJson } from '../../lib/server/http.js'
import { getStore } from '../../lib/server/store.js'

export default async function handler(req, res) {
  // Vercel passes this header on cron invocations
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return sendJson(res, 401, { error: 'Unauthorized' })
  }

  try {
    const store = getStore()
    const { expired } = await store.expirePendingOffers()
    return sendJson(res, 200, { ok: true, expired })
  } catch (error) {
    return sendJson(res, 500, { error: error.message })
  }
}
