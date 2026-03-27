const BASE = import.meta.env.VITE_API_URL

/**
 * Fetch both users' records for a pair.
 * Returns an array of up to 2 items:
 *   [{ userId, workouts, userProfile, challenge, updatedAt }, ...]
 */
export async function getPair(pairId) {
  const res = await fetch(`${BASE}/pair/${pairId}`)
  if (!res.ok) throw new Error(`GET /pair failed: ${res.status}`)
  return res.json()
}

/**
 * Save one user's data to the pair record.
 * payload = { workouts, userProfile, challenge }
 */
export async function putPairUser(pairId, userId, payload) {
  const res = await fetch(`${BASE}/pair/${pairId}/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(`PUT /pair failed: ${res.status}`)
  return res.json()
}
