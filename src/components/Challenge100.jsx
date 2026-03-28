import React from 'react'
import { useStore, getCompletedDaysCount, getStreak, getBestStreak, getChallengeLabel, getMakeupEntries } from '../store.jsx'
import { FitnessIcon } from './FitnessIcon.jsx'

export default function Challenge100() {
  const { state } = useStore()
  const { challenge, activeUser, users } = state
  const { startDate, endDate, days } = challenge

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  const completedDays = getCompletedDaysCount(state, activeUser, startDate)
  const streak = getStreak(state, activeUser)
  const bestStreak = getBestStreak(state, activeUser)
  const restoredSet = new Set(getMakeupEntries(state, activeUser).map(entry => entry.missedDate))
  const user = users[activeUser]

  function getDayStatus(dayNum) {
    if (!startDate) return 'future'
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)

    const targetDate = new Date(start)
    targetDate.setDate(start.getDate() + dayNum - 1)
    const targetStr = targetDate.toISOString().split('T')[0]

    const workouts = state.workouts[`user${activeUser}`][targetStr] || []
    const isRestored = restoredSet.has(targetStr)

    if (targetStr === todayStr) return workouts.length > 0 ? 'completed' : 'today'
    if (targetDate > today) return 'future'
    if (isRestored) return 'makeup'
    return workouts.length > 0 ? 'completed' : 'missed'
  }

  function getCurrentDay() {
    if (!startDate) return 0
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24))
    return Math.max(0, Math.min(days, diff + 1))
  }

  const currentDay = getCurrentDay()
  const progressPct = Math.min(100, Math.round((completedDays / Math.max(days, 1)) * 100))

  return (
    <div className="challenge-screen scroll-section">
      {/* Header card */}
      <div className="challenge-header-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div className="challenge-title">{getChallengeLabel(challenge)}</div>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <FitnessIcon name={user.emoji} size={22} />
          </span>
        </div>
        <div className="challenge-subtitle">
          {startDate
            ? `From ${new Date(startDate + 'T12:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })} to ${new Date(endDate + 'T12:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`
            : 'No challenge started yet'}
        </div>

        {/* Progress bar */}
        <div className="progress-bar-wrapper">
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="progress-bar-labels">
            <span>{completedDays} days completed</span>
            <span>{progressPct}%</span>
          </div>
        </div>

        {/* Stats */}
        <div className="challenge-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="challenge-stat">
            <div className="challenge-stat-num">{currentDay}</div>
            <div className="challenge-stat-label">Current Day</div>
          </div>
          <div className="challenge-stat">
            <div className="challenge-stat-num">{completedDays}</div>
            <div className="challenge-stat-label">Completed</div>
          </div>
          <div className="challenge-stat">
            <div className="challenge-stat-num" style={{ color: 'var(--accent-amber)' }}>
              {streak}🔥
            </div>
            <div className="challenge-stat-label">Current</div>
          </div>
          <div className="challenge-stat">
            <div className="challenge-stat-num" style={{ color: 'var(--accent-blue)' }}>
              {bestStreak}🏆
            </div>
            <div className="challenge-stat-label">Best</div>
          </div>
        </div>
      </div>

      {/* Days grid */}
      <div className="days-grid">
        {Array.from({ length: days }, (_, i) => {
          const dayNum = i + 1
          const status = getDayStatus(dayNum)

          return (
            <div
              key={dayNum}
              className={`day-tile ${status}`}
              title={`Day ${dayNum}`}
            >
              {dayNum}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, padding: '16px 0 8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { cls: 'completed', label: 'Done' },
          { cls: 'makeup', label: 'Restored' },
          { cls: 'today', label: 'Today' },
          { cls: 'missed', label: 'Missed' },
          { cls: 'future', label: 'Upcoming' }
        ].map(({ cls, label }) => (
          <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className={`day-tile ${cls}`} style={{ width: 16, height: 16, fontSize: 0, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
          </div>
        ))}
      </div>

      {completedDays >= days && (
        <div style={{
          textAlign: 'center',
          padding: '24px 20px',
          background: 'rgba(96,165,250,0.12)',
          border: '1px solid rgba(96,165,250,0.35)',
          borderRadius: 16,
          marginTop: 16
        }}>
          <div style={{ marginBottom: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <FitnessIcon name="trophy" size={40} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-lime)', marginBottom: 4 }}>
            Challenge Complete!
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            You crushed all {days} days! Amazing work, {user.name}!
          </div>
        </div>
      )}
    </div>
  )
}
