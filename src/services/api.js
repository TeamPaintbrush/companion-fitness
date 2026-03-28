const BASE = import.meta.env.VITE_API_URL

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
  const res = await fetch(`${BASE}/pair/${pairId}`, {
    headers: buildHeaders(opts)
  })
  if (!res.ok) throw new Error(`GET /pair failed: ${res.status}`)
  return res.json()
}

/**
 * Save one user's data to the pair record.
 * payload = { workouts, userProfile, challenge }
 */
export async function putPairUser(pairId, userId, payload, opts = {}) {
  const res = await fetch(`${BASE}/pair/${pairId}/${userId}`, {
    method: 'PUT',
    headers: buildHeaders({ ...opts, withJson: true }),
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(`PUT /pair failed: ${res.status}`)
  return res.json()
}
