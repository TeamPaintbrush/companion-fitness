import React, { useState } from 'react'
import { useStore, EMOJIS, WORKOUT_COLORS, COLOR_VALUES } from '../store.jsx'
import { FitnessIcon } from './FitnessIcon.jsx'

export default function ProfileTab() {
  const { state, dispatch } = useStore()
  const { users, challenge, activeUser } = state

  const [editingUser, setEditingUser] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmFullReset, setConfirmFullReset] = useState(false)

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
    dispatch({ type: 'UPDATE_CHALLENGE', challenge: { startDate: date } })
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
        <div className="profile-section-title">100-Day Challenge</div>
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
            <span className="profile-row-label">Duration</span>
            <span className="profile-row-value">100 days</span>
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
            <span className="profile-row-value">Local only</span>
          </div>
        </div>
      </div>
    </div>
  )
}
