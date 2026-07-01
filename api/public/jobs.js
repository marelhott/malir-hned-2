import { sendJson, sendMethodNotAllowed, readJsonBody } from '../../lib/server/http.js'
import { getPublicJobRateLimit, recordPublicJobAttempt } from '../../lib/server/auth.js'
import { getStore } from '../../lib/server/store.js'
import { validatePublicJobPayload } from '../../lib/server/public-job-validation.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  try {
    const limit = getPublicJobRateLimit(req)
    if (limit.isLimited) {
      return sendJson(res, 429, {
        error: 'Příliš mnoho pokusů o odeslání. Zkuste to prosím znovu později.',
        retryAfterSeconds: Math.ceil(limit.retryAfterMs / 1000),
      })
    }

    const payload = await readJsonBody(req)
    recordPublicJobAttempt(req)
    validatePublicJobPayload(payload)
    const result = await getStore().createJob(payload, req)
    return sendJson(res, 200, {
      ok: true,
      reference: result.job.reference,
      status: result.job.status,
      publicUrl: result.links.publicUrl,
      cancelUrl: result.links.cancelUrl,
    })
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Zakázku se nepodařilo vytvořit.' })
  }
}
