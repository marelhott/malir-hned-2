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
    const state = await store.readState()
    const now = new Date()
    let expired = 0

    for (const offer of state.job_offers) {
      if (offer.status !== 'pending') continue
      if (!offer.expires_at) continue
      if (new Date(offer.expires_at) > now) continue

      offer.status = 'expired'
      offer.updated_at = now.toISOString()

      // Reset job to ready_to_offer so admin sees it needs re-offering
      const job = state.jobs.find((j) => j.id === offer.job_id)
      if (job && job.status === 'offered_to_painter') {
        job.status = 'ready_to_offer'
        job.updated_at = now.toISOString()
        state.job_events.push({
          id: crypto.randomUUID(),
          job_id: job.id,
          offer_id: offer.id,
          actor_type: 'system',
          actor_id: null,
          actor_label: 'System',
          event_type: 'offer_expired',
          payload: { painterId: offer.painter_id, painterName: offer.painter_name },
          created_at: now.toISOString(),
        })
      }
      expired++
    }

    if (expired > 0) {
      await store.writeState(state)
    }

    return sendJson(res, 200, { ok: true, expired })
  } catch (error) {
    return sendJson(res, 500, { error: error.message })
  }
}
