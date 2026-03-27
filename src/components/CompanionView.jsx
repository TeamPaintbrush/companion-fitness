import React, { useState } from 'react'
import { useStore, getWorkoutsForDate } from '../store.jsx'
import WorkoutCard from './WorkoutCard.jsx'
import { FitnessIcon } from './FitnessIcon.jsx'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getWeekDates(selectedDate) {
  const d = new Date(selectedDate + 'T12:00:00')
  const day = d.getDay()
  const sunday = new Date(d)
  sunday.setDate(d.getDate() - day)
  const week = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(sunday)
    date.setDate(sunday.getDate() + i)
    week.push(date.toISOString().split('T')[0])
  }
  return week
}

export default function CompanionView() {
  const { state, dispatch } = useStore()
  const { users, activeUser, selectedDate } = state

  // companion = the other user
  const companionId = activeUser === 0 ? 1 : 0
  const myUser = users[activeUser]
  const companionUser = users[companionId]

  const [viewMode, setViewMode] = useState('companion') // 'mine' | 'companion'
  const [compDate, setCompDate] = useState(selectedDate)

  const today = new Date().toISOString().split('T')[0]
  const weekDates = getWeekDates(compDate)
  const displayUserId = viewMode === 'mine' ? activeUser : companionId
  const displayUser = viewMode === 'mine' ? myUser : companionUser

  const workouts = getWorkoutsForDate(state, displayUserId, compDate)
  const totalExercises = workouts.reduce((sum, w) => sum + (w.exercises?.length || 0), 0)

  const dateLabel = (() => {
    if (compDate === today) return 'Today'
    const d = new Date(compDate + 'T12:00:00')
    return d.toLocaleString('default', { weekday: 'long', month: 'short', day: 'numeric' })
  })()

  return (
    <div className="companion-screen scroll-section">
      {/* Toggle */}
      <div className="companion-toggle">
        <button
          className={`toggle-btn ${viewMode === 'mine' ? 'active' : ''}`}
          onClick={() => setViewMode('mine')}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <FitnessIcon name={myUser.emoji} size={14} />
            My Workouts
          </span>
        </button>
        <button
          className={`toggle-btn ${viewMode === 'companion' ? 'active' : ''}`}
          onClick={() => setViewMode('companion')}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <FitnessIcon name={companionUser.emoji} size={14} />
            {companionUser.name}
          </span>
        </button>
      </div>

      {viewMode === 'companion' && (
        <div className="companion-readonly-badge">
          🔒 View only — {companionUser.name}'s data
        </div>
      )}

      {/* Week strip for companion */}
      <div style={{ padding: '4px 16px 8px' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {weekDates.map(date => {
            const d = new Date(date + 'T12:00:00')
            const dayLabel = DAY_LABELS[d.getDay()]
            const dayNum = d.getDate()
            const isSelected = date === compDate
            const isToday = date === today
            const userWorkouts = getWorkoutsForDate(state, displayUserId, date)
            const dots = userWorkouts.slice(0, 3).map(w => w.color || 'white')

            return (
              <div
                key={date}
                className={`week-day-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setCompDate(date)}
              >
                <span className="week-day-label">{dayLabel}</span>
                <div className="week-day-num">{dayNum}</div>
                <div className="week-day-dots">
                  {dots.map((color, i) => (
                    <div key={i} className={`week-day-dot ${color}`} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="day-summary">
        <span style={{ marginRight: 6, display: 'inline-flex', verticalAlign: 'middle' }}>
          <FitnessIcon name={displayUser.emoji} size={14} />
        </span>
        <strong>{displayUser.name}</strong>
        {' · '}
        {dateLabel}
        {workouts.length > 0
          ? ` — ${workouts.length} workout${workouts.length !== 1 ? 's' : ''}`
          : ' — No workouts'}
      </div>

      {/* Workouts */}
      <div className="workout-cards-list">
        {workouts.length === 0 ? (
          <div className="empty-day">
            <div className="empty-icon" style={{ marginBottom: 8 }}><FitnessIcon name={displayUser.emoji} size={36} /></div>
            <p>
              {viewMode === 'companion'
                ? `${companionUser.name} hasn't logged any workouts for this day.`
                : 'No workouts logged for this day.'}
            </p>
          </div>
        ) : (
          workouts.map(workout => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              date={compDate}
              userId={displayUserId}
              onClick={() => {}} // read-only for companion
            />
          ))
        )}
      </div>

      {/* Companion comparison card */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 16
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-tertiary)', marginBottom: 12 }}>
            Today's Comparison
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { user: myUser, uid: activeUser },
              { user: companionUser, uid: companionId }
            ].map(({ user, uid }) => {
              const todayWorkouts = getWorkoutsForDate(state, uid, today)
              const todayExercises = todayWorkouts.reduce((s, w) => s + (w.exercises?.length || 0), 0)
              return (
                <div key={uid} style={{
                  background: 'var(--bg-input)',
                  borderRadius: 12,
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ marginBottom: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FitnessIcon name={user.emoji} size={24} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{user.name}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-lime)' }}>
                    {todayWorkouts.length}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    workouts
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {todayExercises} exercises
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
