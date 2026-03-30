import React, { useEffect, useState } from 'react'
import { useStore, EMOJIS, WORKOUT_COLORS, COLOR_VALUES, todayStr } from '../store.jsx'
import { getPair } from '../services/api.js'
import { FitnessIcon } from './FitnessIcon.jsx'

// Readable characters only — no 0/O, 1/I/L confusion
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function newCode() {
  return Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
}
function newSecret() {
  return Array.from({ length: 10 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
}
function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function getDurationDays(startDate, endDate) {
  const start = new Date(startDate + 'T12:00:00')
  const end = new Date(endDate + 'T12:00:00')
  return Math.max(1, Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1)
}

function logOnboardingEvent(type, detail = {}) {
  try {
    const key = 'companion-fitness-onboarding-events'
    const raw = localStorage.getItem(key)
    const parsed = JSON.parse(raw || '[]')
    const list = Array.isArray(parsed) ? parsed : []
    list.push({ ts: new Date().toISOString(), type, ...detail })
    localStorage.setItem(key, JSON.stringify(list.slice(-50)))
  } catch {
    // Best effort telemetry only.
  }
}

// Share pair code + secret via native share sheet (SMS etc.) or clipboard fallback
async function sharePairCode(pairCode, secret) {
  const text = [
    `Hey! Join my Companion Fitness challenge 💪`,
    ``,
    `Pair code:     ${pairCode}`,
    `Invite secret: ${secret}`,
    ``,
    `Open the app: https://teampaintbrush.github.io/companion-fitness`
  ].join('\n')
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Companion Fitness — Join my challenge!', text })
      return 'shared'
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'error'
  }
}

// Reusable user profile card
function UserProfileCard({ label, user, onChange }) {
  return (
    <div className="setup-user-card">
      <div className="setup-user-num">{label}</div>
      <input
        className="form-input"
        type="text"
        placeholder="Your name…"
        value={user.name}
        onChange={e => onChange('name', e.target.value)}
        style={{ marginBottom: 14 }}
      />
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
        Choose Icon
      </div>
      <div className="setup-emoji-row">
        {EMOJIS.map(em => (
          <button key={em} className={`setup-emoji-btn ${user.emoji === em ? 'selected' : ''}`} onClick={() => onChange('emoji', em)}>
            <FitnessIcon name={em} size={20} />
          </button>
        ))}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8, marginTop: 4 }}>
        Color Theme
      </div>
      <div className="setup-color-row">
        {WORKOUT_COLORS.map(c => (
          <div key={c} className={`setup-color-btn ${user.color === c ? 'selected' : ''}`} style={{ background: COLOR_VALUES[c] }} onClick={() => onChange('color', c)} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${COLOR_VALUES[user.color]}22`, border: `2px solid ${COLOR_VALUES[user.color]}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FitnessIcon name={user.emoji} size={20} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{user.name || 'Your name'}</div>
          <div style={{ fontSize: 11, color: COLOR_VALUES[user.color] }}>{user.color} theme</div>
        </div>
      </div>
    </div>
  )
}

export default function UserSetup() {
  const { dispatch } = useStore()

  // step: 'welcome' | 'profiles' | 'create-code' | 'join'
  const [step, setStep] = useState('welcome')

  // Creator state
  const [users, setUsers] = useState([
    { name: '', emoji: 'dumbbell', color: 'white' },
    { name: '', emoji: 'heart', color: 'tan' }
  ])
  const [startDate, setStartDate] = useState(todayStr())
  const [endDate, setEndDate] = useState(addDays(todayStr(), 99))
  const [genCode, setGenCode] = useState(newCode)
  const [inviteSecret, setInviteSecret] = useState(newSecret)
  const [shareStatus, setShareStatus] = useState(null) // null | 'shared' | 'copied' | 'cancelled'

  // Joiner state
  const [joinCode, setJoinCode] = useState('')
  const [joinSecret, setJoinSecret] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [showResetToast, setShowResetToast] = useState(false)

  useEffect(() => {
    try {
      const hasNotice = sessionStorage.getItem('companion-fitness-reset-notice') === '1'
      if (!hasNotice) return
      sessionStorage.removeItem('companion-fitness-reset-notice')
      setShowResetToast(true)
      const timer = setTimeout(() => setShowResetToast(false), 3200)
      return () => clearTimeout(timer)
    } catch {}
  }, [])

  const canContinueProfiles = users[0].name.trim() && users[1].name.trim()
  const joinReady = joinCode.trim().length === 6 && joinSecret.trim().length >= 8

  function updateUser(idx, field, value) {
    setUsers(prev => prev.map((u, i) => i === idx ? { ...u, [field]: value } : u))
  }

  function handleShareCode() {
    sharePairCode(genCode, inviteSecret).then(result => {
      setShareStatus(result)
      if (result !== 'cancelled') setTimeout(() => setShareStatus(null), 2800)
    })
  }

  async function handleStartCreate() {
    if (creating) return
    setCreating(true)
    setCreateError('')

    try {
      const existing = await getPair(genCode, { pairSecret: inviteSecret })
      if (Array.isArray(existing) && existing.length > 0) {
        setCreating(false)
        setCreateError('That pair code is already in use. Tap Generate new code and try again.')
        logOnboardingEvent('create_code_conflict', { pairId: genCode })
        return
      }
    } catch (err) {
      const status = Number(err?.status || 0)
      if (status === 403) {
        setCreating(false)
        setCreateError('That pair code is already in use. Tap Generate new code and try again.')
        logOnboardingEvent('create_code_conflict', { pairId: genCode, status })
        return
      }
      setCreating(false)
      setCreateError('Unable to verify pair code right now. Check your connection and try again.')
      logOnboardingEvent('create_verify_failed', { pairId: genCode, status: status || 'unknown' })
      return
    }

    dispatch({
      type: 'COMPLETE_SETUP',
      users: users.map(u => ({ name: u.name.trim() || 'User', emoji: u.emoji, color: u.color })),
      startDate,
      endDate,
      days: getDurationDays(startDate, endDate),
      pairId: genCode,
      pairSecret: inviteSecret,
      myUserId: 0
    })
    logOnboardingEvent('create_success', { pairId: genCode })
  }

  async function handleStartJoin() {
    if (!joinReady || joining) return
    const code = joinCode.toUpperCase().trim()
    const secret = joinSecret.toUpperCase().trim()

    setJoining(true)
    setJoinError('')

    // Fetch existing pair data so we can show real names immediately
    let creatorProfile = { name: 'Partner', emoji: 'dumbbell', color: 'white' }
    let mySeededProfile = null
    let challengeData = null

    try {
      const records = await getPair(code, { pairSecret: secret })
      const creatorRecord = records.find(r => r.userId === 'user0')
      if (!creatorRecord) {
        setJoining(false)
        setJoinError('This pair is not active yet. Ask your partner to start the challenge first, then try again.')
        logOnboardingEvent('join_no_creator', { pairId: code })
        return
      }
      if (creatorRecord) {
        const raw = creatorRecord.userProfile || {}
        mySeededProfile = raw.partnerProfileSeed || null
        const { partnerProfileSeed: _seed, ...profile } = raw
        if (profile.name) creatorProfile = profile
        if (creatorRecord.challenge) challengeData = creatorRecord.challenge
      }
    } catch (err) {
      // Fail closed on all join fetch errors.
      const status = Number(err?.status || 0)
      setJoining(false)
      if (status === 401 || status === 403) {
        setJoinError('Invalid pair code or invite secret. Double-check with your partner.')
      } else if (status === 409) {
        setJoinError('This pair is not active yet. Ask your partner to start the challenge first, then try again.')
      } else {
        setJoinError('Could not connect to pairing service. Check your connection and try again.')
      }
      logOnboardingEvent('join_failed', { pairId: code, status: status || 'unknown' })
      return
    }

    const myProfile = mySeededProfile && mySeededProfile.name
      ? mySeededProfile
      : { name: 'You', emoji: 'heart', color: 'tan' }

    dispatch({
      type: 'COMPLETE_SETUP',
      users: [creatorProfile, myProfile],
      startDate: challengeData?.startDate || todayStr(),
      endDate: challengeData?.endDate || addDays(todayStr(), 99),
      days: challengeData?.days || 100,
      pairId: code,
      pairSecret: secret,
      myUserId: 1
    })
    logOnboardingEvent('join_success', { pairId: code })
  }

  const ResetToast = showResetToast ? (
    <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(96,165,250,0.45)', background: 'rgba(96,165,250,0.15)', color: '#dbeafe', fontSize: 13, fontWeight: 700, textAlign: 'center' }}>
      Reset complete. You are back to a fresh app state.
    </div>
  ) : null

  // ─── Welcome ──────────────────────────────────────────────────────────────
  if (step === 'welcome') {
    return (
      <div className="setup-screen">
        {ResetToast}
        <div className="setup-logo"><FitnessIcon name="activity" size={56} /></div>
        <h1 className="setup-title"><span>Companion</span> Fitness</h1>
        <p className="setup-subtitle">
          A flexible fitness challenge tracker<br />for you and your companion
        </p>
        <div className="setup-step">
          {/* Join first — companions land here and go straight in */}
          <div className="setup-user-card" style={{ border: '2px solid var(--accent-lime)', background: 'rgba(198,241,53,0.05)' }}>
            <div className="setup-user-num" style={{ color: 'var(--accent-lime)' }}>🔗 Got a pair code?</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '6px 0 14px' }}>
              Your partner already set up the challenge and shared a code with you. Jump straight in.
            </p>
            <button
              onClick={() => setStep('join')}
              style={{ width: '100%', padding: '14px', background: 'var(--accent-lime)', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800, color: '#000', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Join Partner's Challenge →
            </button>
          </div>

          <div style={{ margin: '4px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 600 }}>— or —</div>

          <button
            className="setup-start-btn"
            onClick={() => setStep('profiles')}
            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            🚀 Start a New Pair Challenge
          </button>
        </div>
      </div>
    )
  }

  // ─── Join (companion / user #2) ───────────────────────────────────────────
  if (step === 'join') {
    return (
      <div className="setup-screen">
        <div className="setup-logo"><FitnessIcon name="link" size={56} /></div>
        <h1 className="setup-title">Join a <span>Challenge</span></h1>
        <p className="setup-subtitle">
          Enter the code your partner shared<br />and you are in
        </p>
        <div className="setup-step">
          <div className="setup-user-card">
            <div className="setup-user-num">Partner's pair code</div>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. ABC123"
              maxLength={6}
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              style={{ fontSize: 28, fontWeight: 800, letterSpacing: 8, textAlign: 'center', marginTop: 10 }}
              autoComplete="off"
            />
            <input
              className="form-input"
              type="text"
              placeholder="Invite secret"
              value={joinSecret}
              onChange={e => setJoinSecret(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              style={{ marginTop: 10, fontSize: 18, fontWeight: 700, letterSpacing: 2, textAlign: 'center' }}
              autoComplete="off"
            />
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, lineHeight: 1.5 }}>
              Ask your partner for both their 6-character pair code and invite secret.
            </p>
            {joinError && (
              <p style={{ fontSize: 13, color: '#f87171', marginTop: 8, fontWeight: 600 }}>{joinError}</p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setStep('welcome')}
              disabled={joining}
              style={{ flex: 0, padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', cursor: joining ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: joining ? 0.45 : 1 }}
            >
              ← Back
            </button>
            <button
              className="setup-start-btn"
              style={{ flex: 1, margin: 0, opacity: (joinReady && !joining) ? 1 : 0.45 }}
              onClick={handleStartJoin}
              disabled={!joinReady || joining}
            >
              {joining ? '⏳ Connecting…' : '🔗 Join Challenge!'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Profiles (creator — User 1) ──────────────────────────────────────────
  if (step === 'profiles') {
    return (
      <div className="setup-screen">
        <div className="setup-logo"><FitnessIcon name="activity" size={56} /></div>
        <h1 className="setup-title"><span>Companion</span> Fitness</h1>
        <p className="setup-subtitle">
          A flexible fitness challenge tracker<br />for you and your companion
        </p>
        <div className="setup-step">
          {[0, 1].map(idx => (
            <UserProfileCard
              key={idx}
              label={idx === 0 ? "User 1 — That's you!" : "User 2 — Your Companion"}
              user={users[idx]}
              onChange={(field, val) => updateUser(idx, field, val)}
            />
          ))}

          <div className="setup-user-card">
            <div className="setup-user-num">📅 Challenge Date Range</div>
            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>Start date</div>
                <input
                  className="form-input"
                  type="date"
                  value={startDate}
                  onChange={e => {
                    const nextStart = e.target.value
                    setStartDate(nextStart)
                    if (endDate < nextStart) setEndDate(nextStart)
                  }}
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>End date</div>
                <input
                  className="form-input"
                  type="date"
                  min={startDate}
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, lineHeight: 1.5 }}>
              Your challenge will run for {getDurationDays(startDate, endDate)} days.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setStep('welcome')}
              style={{ flex: 0, padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              ← Back
            </button>
            <button
              className="setup-start-btn"
              style={{ flex: 1, margin: 0, opacity: canContinueProfiles ? 1 : 0.45 }}
              onClick={() => setStep('create-code')}
              disabled={!canContinueProfiles}
            >
              {canContinueProfiles ? 'Next — Get Pair Code →' : 'Enter both names to continue'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Create code (creator gets their code + share button) ─────────────────
  return (
    <div className="setup-screen">
      <div className="setup-logo"><FitnessIcon name="link" size={56} /></div>
      <h1 className="setup-title">Connect <span>Devices</span></h1>
      <p className="setup-subtitle">
        Share this code with your companion<br />so your workouts stay in sync
      </p>
      <div className="setup-step">
        <div className="setup-user-card">
          <div className="setup-user-num">Your pair code</div>
          <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: 10, color: '#fff', textAlign: 'center', padding: '20px 0 4px', fontVariantNumeric: 'tabular-nums' }}>
            {genCode}
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 10, marginBottom: 14, background: 'var(--bg-input)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>
              Invite Secret
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: 2, color: '#fff', textAlign: 'center' }}>{inviteSecret}</div>
          </div>
          {createError && (
            <p style={{ fontSize: 13, color: '#f87171', marginBottom: 10, fontWeight: 600 }}>{createError}</p>
          )}

          {/* Share button — uses native phone share sheet → SMS etc. */}
          <button
            onClick={handleShareCode}
            style={{
              width: '100%', padding: '15px', background: shareStatus ? 'rgba(198,241,53,0.2)' : 'var(--accent-lime)',
              border: shareStatus ? '2px solid var(--accent-lime)' : 'none',
              borderRadius: 12, fontSize: 16, fontWeight: 800,
              color: shareStatus ? 'var(--accent-lime)' : '#000',
              cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10,
              transition: 'all 0.2s ease'
            }}
          >
            {shareStatus === 'copied'
              ? '✓ Copied to clipboard!'
              : shareStatus === 'shared'
              ? '✓ Sent!'
              : '📤 Share Code with Partner'}
          </button>

          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.6, marginBottom: 10 }}>
            Tap to send via Messages, WhatsApp, email — whatever works. Your companion enters both the code and secret to join.
          </p>

          <button
            onClick={() => { setGenCode(newCode()); setInviteSecret(newSecret()) }}
            style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Generate new code
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setStep('profiles')}
            style={{ flex: 0, padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ← Back
          </button>
          <button
            className="setup-start-btn"
            style={{ flex: 1, margin: 0, opacity: creating ? 0.45 : 1 }}
            onClick={handleStartCreate}
            disabled={creating}
          >
            {creating ? '⏳ Verifying…' : '🚀 Start Challenge!'}
          </button>
        </div>
      </div>
    </div>
  )
}
