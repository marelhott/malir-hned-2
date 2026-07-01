import { sendJson, sendMethodNotAllowed, readJsonBody } from '../../lib/server/http.js'
import { getStore } from '../../lib/server/store.js'
import { validatePublicJobCompletionPatch } from '../../lib/server/public-job-validation.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['POST'])

  try {
    const body = await readJsonBody(req)
    const patch = validatePublicJobCompletionPatch(body)
    const result = await getStore().completePublicJob(patch.token, patch)
    return sendJson(res, 200, { ok: true, result })
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Doplnění se nepodařilo uložit.' })
  }
}
