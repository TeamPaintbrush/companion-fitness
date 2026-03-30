const BASE = import.meta.env.VITE_API_URL

function recordApiFailure(event) {
  try {
    const key = 'companion-fitness-api-errors'
    const raw = localStorage.getItem(key)
    const parsed = JSON.parse(raw || '[]')
    const list = Array.isArray(parsed) ? parsed : []
    list.push({ ts: new Date().toISOString(), ...event })
    localStorage.setItem(key, JSON.stringify(list.slice(-50)))
  } catch {
    // Non-blocking telemetry best effort only.
  }
}

function buildApiError(method, path, status) {
  const err = new Error(`${method} ${path} failed: ${status}`)
  err.status = status
  return err
}

function getAuthToken(explicitToken) {
  if (explicitToken) return explicitToken
  if (import.meta.env.VITE_JWT_TOKEN) return import.meta.env.VITE_JWT_TOKEN
  try {
    return localStorage.getItem('companion-fitness-id-token') || ''
  } catch {
    return ''
  }
}

function buildHeaders({ pairSecret, authToken, withJson } = {}) {
  const headers = {}
  if (withJson) headers['Content-Type'] = 'application/json'
  if (pairSecret) headers['x-pair-secret'] = pairSecret
  const token = getAuthToken(authToken)
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

/**
 * Fetch both users' records for a pair.
 * Returns an array of up to 2 items:
 *   [{ userId, workouts, userProfile, challenge, updatedAt }, ...]
 */
export async function getPair(pairId, opts = {}) {
  const path = `/pair/${pairId}`
  const res = await fetch(`${BASE}${path}`, {
    headers: buildHeaders(opts)
  })
  if (!res.ok) {
    recordApiFailure({ method: 'GET', path, status: res.status })
    throw buildApiError('GET', path, res.status)
  }
  return res.json()
}

/**
 * Save one user's data to the pair record.
 * payload = { workouts, userProfile, challenge }
 */
export async function putPairUser(pairId, userId, payload, opts = {}) {
  const path = `/pair/${pairId}/${userId}`
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: buildHeaders({ ...opts, withJson: true }),
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    recordApiFailure({ method: 'PUT', path, status: res.status })
    throw buildApiError('PUT', path, res.status)
  }
  return res.json()
}
