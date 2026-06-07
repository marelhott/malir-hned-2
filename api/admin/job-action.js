import { requireAdmin } from '../../lib/server/auth.js'
import { sendJson, sendMethodNotAllowed, readJsonBody } from '../../lib/server/http.js'
import { getStore } from '../../lib/server/store.js'
import { JOB_STATUSES } from '../../lib/shared.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])
  const admin = requireAdmin(req)
  if (!admin) return sendJson(res, 401, { error: 'Unauthorized' })

  try {
    const body = await readJsonBody(req)
    const store = getStore()
    const jobId = body.jobId
    const action = body.action

    if (!jobId || !action) {
      return sendJson(res, 400, { error: 'Chybí jobId nebo action.' })
    }

    let result
    if (action === 'request_completion') {
      result = await store.requestCompletion(jobId, admin.email, body.reason)
    } else if (action === 'prepare_job') {
      result = await store.prepareJob(jobId, admin.email, body.confirmedPrice, body.painterPayout)
    } else if (action === 'send_offer') {
      result = await store.sendOffer(jobId, body.painterId, admin.email, req)
    } else if (action === 'withdraw_offer') {
      result = await store.withdrawOffer(jobId, body.offerId, admin.email)
    } else if (action === 'confirm_assignment') {
      result = await store.confirmAssignment(jobId, admin.email)
    } else if (action === 'return_to_dispatch') {
      result = await store.returnToDispatch(jobId, admin.email)
    } else if (action === 'mark_in_progress') {
      result = await store.markJobState(jobId, admin.email, JOB_STATUSES.IN_PROGRESS)
    } else if (action === 'mark_done') {
      result = await store.markJobState(jobId, admin.email, JOB_STATUSES.DONE)
    } else if (action === 'cancel_job') {
      result = await store.cancelAdminJob(jobId, admin.email)
    } else if (action === 'set_status') {
      if (!body.status) return sendJson(res, 400, { error: 'Chybí status.' })
      result = await store.setJobStatus(jobId, admin.email, body.status)
    } else if (action === 'add_note') {
      if (!body.note) return sendJson(res, 400, { error: 'Chybí poznámka.' })
      result = await store.addJobNote(jobId, admin.email, body.note)
    } else {
      return sendJson(res, 400, { error: 'Neznámá akce.' })
    }

    return sendJson(res, 200, { ok: true, result })
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Akci se nepodařilo provést.' })
  }
}
