import { useEffect, useRef, useState, useCallback } from 'react'
import { getPair, putPairUser } from '../services/api.js'

const POLL_MS  = 10_000  // poll partner every 10 seconds
const SAVE_MS  =  2_000  // debounce own saves by 2 seconds

export function useSync(state, dispatch) {
  const { pairId, pairSecret, myUserId, workouts, users, challenge, setupComplete } = state
  const [status, setStatus] = useState('idle') // 'idle' | 'syncing' | 'live' | 'error'

  const saveTimer   = useRef(null)
  const pollTimer   = useRef(null)
  const lastSaved   = useRef(null)

  // Only sync when API URL is configured and setup is done
  const active = !!(import.meta.env.VITE_API_URL && pairId && pairSecret && setupComplete)

  const myUserKey     = `user${myUserId}`
  const partnerUserId = myUserId === 0 ? 1 : 0
  const partnerKey    = `user${partnerUserId}`

  // ── Save own data ──────────────────────────────────────────────────────────
  const saveOwn = useCallback(async () => {
    if (!active) return
    const payload = {
      workouts:    workouts[myUserKey] || {},
      userProfile: users[myUserId]     || {},
      challenge
    }
    const fingerprint = JSON.stringify(payload)
    if (fingerprint === lastSaved.current) return   // nothing changed

    setStatus('syncing')
    try {
      await putPairUser(pairId, myUserKey, payload, { pairSecret })
      lastSaved.current = fingerprint
      setStatus('live')
    } catch (err) {
      console.warn('[sync] save failed:', err.message)
      setStatus('error')
    }
  }, [active, pairId, pairSecret, myUserKey, myUserId, workouts, users, challenge])

  // ── Poll partner data ──────────────────────────────────────────────────────
  const pollPartner = useCallback(async () => {
    if (!active) return
    try {
      const records      = await getPair(pairId, { pairSecret })
      const partnerRecord = records.find(r => r.userId === partnerKey)
      if (partnerRecord) {
        dispatch({
          type:        'SYNC_PARTNER',
          partnerId:   partnerUserId,
          workouts:    partnerRecord.workouts    || {},
          userProfile: partnerRecord.userProfile || null,
          challenge:   partnerRecord.challenge   || null
        })
      }
      setStatus('live')
    } catch (err) {
      console.warn('[sync] poll failed:', err.message)
      setStatus('error')
    }
  }, [active, pairId, pairSecret, partnerKey, partnerUserId, dispatch])

  // ── Debounced save when own data changes ───────────────────────────────────
  useEffect(() => {
    if (!active) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(saveOwn, SAVE_MS)
    return () => clearTimeout(saveTimer.current)
  }, [active, workouts, users, challenge, saveOwn])

  // ── Polling loop ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return
    pollPartner()                                          // immediate on mount
    pollTimer.current = setInterval(pollPartner, POLL_MS)
    return () => clearInterval(pollTimer.current)
  }, [active, pairId, pollPartner])

  return status
}
