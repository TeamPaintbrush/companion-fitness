import React, { useEffect, useState } from 'react'
import { useStore, EMOJIS, WORKOUT_COLORS, COLOR_VALUES } from '../store.jsx'
import { FitnessIcon } from './FitnessIcon.jsx'

// Readable characters only — no 0/O, 1/I/L confusion
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function newCode() {
  return Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
}

export default function UserSetup() {
  const { dispatch } = useStore()

  const [step, setStep] = useState('profiles') // 'profiles' | 'pair'

  const [users, setUsers] = useState([
    { name: '', emoji: 'dumbbell', color: 'white' },
    { name: '', emoji: 'heart', color: 'tan' }
  ])
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])

  // Pair code state
  const [mode, setMode]       = useState('create')  // 'create' | 'join'
  const [genCode, setGenCode] = useState(newCode)   // generated code for creator
  const [joinCode, setJoinCode] = useState('')       // code typed by joiner
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

  function updateUser(idx, field, value) {
    setUsers(prev => prev.map((u, i) => i === idx ? { ...u, [field]: value } : u))
  }

  const canContinue = users[0].name.trim() && users[1].name.trim()

  function handleStart() {
    const pairId   = mode === 'create' ? genCode : joinCode.toUpperCase().trim()
    const myUserId = mode === 'create' ? 0 : 1
    if (!pairId || pairId.length !== 6) return

    dispatch({
      type: 'COMPLETE_SETUP',
      users: users.map(u => ({ name: u.name.trim() || 'User', emoji: u.emoji, color: u.color })),
      startDate,
      pairId,
      myUserId
    })
  }

  // ─── Step 1: profiles ──────────────────────────────────────────────────────
  if (step === 'profiles') {
    return (
      <div className="setup-screen">
        {showResetToast && (
          <div
            style={{
              marginBottom: 14,
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid rgba(96, 165, 250, 0.45)',
              background: 'rgba(96, 165, 250, 0.15)',
              color: '#dbeafe',
              fontSize: 13,
              fontWeight: 700,
              textAlign: 'center'
            }}
          >
            Reset complete. You are back to a fresh app state.
          </div>
        )}
        <div className="setup-logo"><FitnessIcon name="activity" size={56} /></div>
        <h1 className="setup-title"><span>Companion</span> Fitness</h1>
        <p className="setup-subtitle">
          A 100-day fitness challenge tracker<br />for you and your companion
        </p>

        <div className="setup-step">
          {[0, 1].map(idx => {
            const user = users[idx]
            return (
              <div className="setup-user-card" key={idx}>
                <div className="setup-user-num">
                  {idx === 0 ? 'User 1 - That\'s you!' : 'User 2 - Your Companion'}
                </div>

                <input
                  className="form-input"
                  type="text"
                  placeholder={idx === 0 ? 'Your name…' : "Companion's name…"}
                  value={user.name}
                  onChange={e => updateUser(idx, 'name', e.target.value)}
                  style={{ marginBottom: 14 }}
                />

                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                  Choose Icon
                </div>
                <div className="setup-emoji-row">
                  {EMOJIS.map(em => (
                    <button key={em} className={`setup-emoji-btn ${user.emoji === em ? 'selected' : ''}`} onClick={() => updateUser(idx, 'emoji', em)}>
                      <FitnessIcon name={em} size={20} />
                    </button>
                  ))}
                </div>

                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8, marginTop: 4 }}>
                  Color Theme
                </div>
                <div className="setup-color-row">
                  {WORKOUT_COLORS.map(c => (
                    <div key={c} className={`setup-color-btn ${user.color === c ? 'selected' : ''}`} style={{ background: COLOR_VALUES[c] }} onClick={() => updateUser(idx, 'color', c)} />
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${COLOR_VALUES[user.color]}22`, border: `2px solid ${COLOR_VALUES[user.color]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    <FitnessIcon name={user.emoji} size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {user.name || (idx === 0 ? 'Your name' : "Companion's name")}
                    </div>
                    <div style={{ fontSize: 11, color: COLOR_VALUES[user.color] }}>{user.color} theme</div>
                  </div>
                </div>
              </div>
            )
          })}

          <div className="setup-user-card">
            <div className="setup-user-num">📅 Challenge Start Date</div>
            <input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ colorScheme: 'dark' }} />
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, lineHeight: 1.5 }}>
              Your 100-day challenge starts on this date.
            </p>
          </div>

          <button
            className="setup-start-btn"
            onClick={() => setStep('pair')}
            disabled={!canContinue}
          >
            {canContinue ? 'Next — Connect Devices →' : 'Enter both names to continue'}
          </button>
        </div>
      </div>
    )
  }

  // ─── Step 2: pair code ─────────────────────────────────────────────────────
  const joinReady = joinCode.trim().length === 6

  return (
    <div className="setup-screen">
      <div className="setup-logo"><FitnessIcon name="link" size={56} /></div>
      <h1 className="setup-title">Connect <span>Devices</span></h1>
      <p className="setup-subtitle">
        Both devices need the same pair code<br />so your workouts stay in sync
      </p>

      <div className="setup-step">
        {/* Mode toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: 12, padding: 4, gap: 4, marginBottom: 4 }}>
          {[['create', 'New pair'], ['join', 'Join pair']].map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 9,
                background: mode === m ? '#fff' : 'transparent',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 14, fontWeight: 700,
                color: mode === m ? '#000' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'create' ? (
          <div className="setup-user-card">
            <div className="setup-user-num">Your pair code</div>
            <div style={{
              fontSize: 42, fontWeight: 900, letterSpacing: 10,
              color: '#fff', textAlign: 'center', padding: '20px 0 10px',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {genCode}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6, marginBottom: 12 }}>
              Share this code with your companion.<br />
              They enter it on their device to link up.
            </p>
            <button
              onClick={() => setGenCode(newCode())}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Generate new code
            </button>
          </div>
        ) : (
          <div className="setup-user-card">
            <div className="setup-user-num">Enter your companion's code</div>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. ABC123"
              maxLength={6}
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              style={{ fontSize: 28, fontWeight: 800, letterSpacing: 8, textAlign: 'center', marginTop: 10 }}
              autoFocus
            />
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, lineHeight: 1.5 }}>
              Ask the other person for their 6-character pair code.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setStep('profiles')}
            style={{ flex: 0, padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ← Back
          </button>
          <button
            className="setup-start-btn"
            style={{ flex: 1, margin: 0 }}
            onClick={handleStart}
            disabled={mode === 'join' && !joinReady}
          >
            🚀 Start Challenge!
          </button>
        </div>
      </div>
    </div>
  )
}
