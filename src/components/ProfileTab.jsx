import React, { useState } from 'react'
import { useStore, EMOJIS, WORKOUT_COLORS, COLOR_VALUES, getChallengeLabel } from '../store.jsx'
import { FitnessIcon } from './FitnessIcon.jsx'

const CONTACT_EMAIL = 'apps@paintbrushmarketing.net'

export default function ProfileTab() {
  const { state, dispatch } = useStore()
  const { users, challenge, pairId, pairSecret } = state

  const [editingUser, setEditingUser] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmFullReset, setConfirmFullReset] = useState(false)
  const [showPairSecret, setShowPairSecret] = useState(false)
  const [authToken, setAuthToken] = useState(() => {
    try {
      return localStorage.getItem('companion-fitness-id-token') || ''
    } catch {
      return ''
    }
  })
  const [authSavedMsg, setAuthSavedMsg] = useState('')

  const [localUsers, setLocalUsers] = useState([
    { ...users[0] },
    { ...users[1] }
  ])

  function updateLocalUser(idx, field, value) {
    setLocalUsers(prev => prev.map((u, i) => i === idx ? { ...u, [field]: value } : u))
  }

  function saveUsers() {
    dispatch({ type: 'UPDATE_USERS', users: localUsers })
    setEditingUser(null)
  }

  function updateStartDate(date) {
    const nextChallenge = { startDate: date }
    if (challenge.endDate && challenge.endDate < date) nextChallenge.endDate = date
    dispatch({ type: 'UPDATE_CHALLENGE', challenge: nextChallenge })
  }

  function updateEndDate(date) {
    dispatch({ type: 'UPDATE_CHALLENGE', challenge: { endDate: date } })
  }

  function handleReset() {
    if (confirmReset) {
      dispatch({ type: 'RESET_CHALLENGE' })
      setConfirmReset(false)
    } else {
      setConfirmReset(true)
      setTimeout(() => setConfirmReset(false), 4000)
    }
  }

  function handleFullReset() {
    if (confirmFullReset) {
      try {
        sessionStorage.setItem('companion-fitness-reset-notice', '1')
      } catch {}
      dispatch({ type: 'FULL_RESET_APP' })
      setConfirmFullReset(false)
    } else {
      setConfirmFullReset(true)
      setTimeout(() => setConfirmFullReset(false), 5000)
    }
  }

  function saveAuthToken() {
    try {
      if (authToken.trim()) localStorage.setItem('companion-fitness-id-token', authToken.trim())
      else localStorage.removeItem('companion-fitness-id-token')
      setAuthSavedMsg('Security token saved.')
      setTimeout(() => setAuthSavedMsg(''), 2200)
    } catch {
      setAuthSavedMsg('Unable to save token on this device.')
      setTimeout(() => setAuthSavedMsg(''), 2200)
    }
  }

  return (
    <div className="profile-screen scroll-section">

      {/* Users */}
      {[0, 1].map(idx => {
        const user = localUsers[idx]
        const isEditing = editingUser === idx

        return (
          <div className="profile-section" key={idx}>
            <div className="profile-section-title">
              {idx === 0 ? 'User 1' : 'User 2 (Companion)'}
            </div>
            <div className="profile-card">
              <div className="profile-user-header">
                <div
                  className="profile-avatar"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                  onClick={() => setEditingUser(isEditing ? null : idx)}
                >
                  <FitnessIcon name={user.emoji} size={20} color="#f5f5f5" />
                </div>
                <div className="profile-user-info">
                  <div className="profile-user-name">{user.name || `User ${idx + 1}`}</div>
                  <div className="profile-user-sub">
                    Tap to {isEditing ? 'collapse' : 'edit'} · {user.color} theme
                  </div>
                </div>
                <button
                  style={{
                    background: isEditing ? 'var(--accent-lime)' : 'var(--bg-input)',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: isEditing ? '#000' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => {
                    if (isEditing) saveUsers()
                    else setEditingUser(idx)
                  }}
                >
                  {isEditing ? 'Save' : 'Edit'}
                </button>
              </div>

              {isEditing && (
                <>
                  <div className="profile-row">
                    <span className="profile-row-label">Name</span>
                    <input
                      className="profile-row-input"
                      type="text"
                      placeholder="Enter name…"
                      value={user.name}
                      onChange={e => updateLocalUser(idx, 'name', e.target.value)}
                    />
                  </div>

                  <div className="profile-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                    <span className="profile-row-label" style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-secondary)' }}>
                      Avatar Icon
                    </span>
                    <div className="emoji-picker-row">
                      {EMOJIS.map(em => (
                        <button
                          key={em}
                          className={`emoji-option ${user.emoji === em ? 'selected' : ''}`}
                          onClick={() => updateLocalUser(idx, 'emoji', em)}
                        >
                          <FitnessIcon name={em} size={18} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="profile-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                    <span className="profile-row-label" style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-secondary)' }}>
                      Color Theme
                    </span>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {WORKOUT_COLORS.map(c => (
                        <div
                          key={c}
                          className={`color-swatch ${user.color === c ? 'selected' : ''}`}
                          style={{ background: COLOR_VALUES[c] }}
                          onClick={() => updateLocalUser(idx, 'color', c)}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })}

      {/* Challenge settings */}
      <div className="profile-section">
        <div className="profile-section-title">{getChallengeLabel(challenge)}</div>
        <div className="profile-card">
          <div className="profile-row">
            <span className="profile-row-label">Start Date</span>
            <input
              type="date"
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 14,
                color: 'var(--text-secondary)',
                outline: 'none',
                fontFamily: 'inherit',
                cursor: 'pointer',
                colorScheme: 'dark'
              }}
              value={challenge.startDate || ''}
              onChange={e => updateStartDate(e.target.value)}
            />
          </div>
          <div className="profile-row">
            <span className="profile-row-label">End Date</span>
            <input
              type="date"
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 14,
                color: 'var(--text-secondary)',
                outline: 'none',
                fontFamily: 'inherit',
                cursor: 'pointer',
                colorScheme: 'dark'
              }}
              min={challenge.startDate || ''}
              value={challenge.endDate || ''}
              onChange={e => updateEndDate(e.target.value)}
            />
          </div>
          <div className="profile-row">
            <span className="profile-row-label">Duration</span>
            <span className="profile-row-value">{challenge.days} days</span>
          </div>
          <div
            className="action-row danger"
            onClick={handleReset}
          >
            <span style={{ flex: 1, fontSize: 14 }}>
              {confirmReset ? '⚠️ Tap again to confirm reset' : '🔄 Reset Challenge'}
            </span>
            <span style={{ fontSize: 14 }}>›</span>
          </div>
          <div
            className="action-row danger"
            onClick={handleFullReset}
            style={{ marginTop: 10, borderColor: '#ff6b6b', color: '#ff9a9a' }}
          >
            <span style={{ flex: 1, fontSize: 14 }}>
              {confirmFullReset
                ? '⚠️ Tap again to reset everything'
                : '🧹 Full Reset App (profiles, pair code, workouts)'}
            </span>
            <span style={{ fontSize: 14 }}>›</span>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="profile-section">
        <div className="profile-section-title">Security</div>
        <div className="profile-card">
          <div className="profile-row">
            <span className="profile-row-label">Pair Code</span>
            <span className="profile-row-value">{pairId || 'Not set'}</span>
          </div>
          <div className="profile-row">
            <span className="profile-row-label">Invite Secret</span>
            <span className="profile-row-value">{pairSecret ? (showPairSecret ? pairSecret : `${pairSecret.slice(0, 4)}••••`) : 'Not set'}</span>
          </div>
          {pairSecret && (
            <button
              onClick={() => setShowPairSecret(v => !v)}
              style={{
                alignSelf: 'flex-end',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                marginTop: 8,
                marginBottom: 4
              }}
            >
              {showPairSecret ? 'Hide Secret' : 'Reveal Secret'}
            </button>
          )}
          <div className="profile-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <span className="profile-row-label" style={{ flex: 'unset' }}>JWT / Cognito ID Token</span>
            <input
              className="profile-row-input"
              type="text"
              placeholder="Paste ID token if JWT auth is enabled"
              value={authToken}
              onChange={e => setAuthToken(e.target.value)}
              style={{ textAlign: 'left' }}
            />
            <button
              onClick={saveAuthToken}
              style={{
                alignSelf: 'flex-end',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              Save Token
            </button>
            {authSavedMsg && (
              <div style={{ fontSize: 12, color: 'var(--accent-lime)' }}>{authSavedMsg}</div>
            )}
          </div>
        </div>
      </div>

      {/* App info */}
      <div className="profile-section">
        <div className="profile-section-title">About</div>
        <div className="profile-card">
          <div className="profile-row">
            <span className="profile-row-label">App</span>
            <span className="profile-row-value">Companion Fitness</span>
          </div>
          <div className="profile-row">
            <span className="profile-row-label">Version</span>
            <span className="profile-row-value">1.0.0</span>
          </div>
          <div className="profile-row">
            <span className="profile-row-label">Storage</span>
            <span className="profile-row-value">Local + AWS sync</span>
          </div>
          <a
            className="action-row"
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Companion Fitness Support')}`}
            style={{ textDecoration: 'none', marginTop: 10 }}
          >
            <span style={{ flex: 1, fontSize: 14 }}>✉️ Contact Us ({CONTACT_EMAIL})</span>
            <span style={{ fontSize: 14 }}>›</span>
          </a>
        </div>
      </div>
    </div>
  )
}
