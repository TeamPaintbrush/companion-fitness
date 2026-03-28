import React, { useEffect, useState } from 'react'
import {
  useStore,
  getWorkoutsForDate,
  getStreak,
  getBestStreak,
  getMissedChallengeDates,
  getMakeupUsage,
  getMakeupEntries,
  getAchievementProgress,
  getChallengeLabel
} from '../store.jsx'
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

function fmtDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('default', {
    month: 'short',
    day: 'numeric'
  })
}

export default function CompanionView() {
  const { state, dispatch } = useStore()
  const { users, activeUser, selectedDate, challenge } = state

  // companion = the other user
  const companionId = activeUser === 0 ? 1 : 0
  const myUser = users[activeUser]
  const companionUser = users[companionId]

  const [viewMode, setViewMode] = useState('companion') // 'mine' | 'companion'
  const [compDate, setCompDate] = useState(selectedDate)
  const [showMakeupPicker, setShowMakeupPicker] = useState(false)
  const [selectedMakeupWorkoutId, setSelectedMakeupWorkoutId] = useState('')
  const [selectedMissedDate, setSelectedMissedDate] = useState('')
  const [draftStartDate, setDraftStartDate] = useState(challenge.startDate || selectedDate)
  const [draftEndDate, setDraftEndDate] = useState(challenge.endDate || selectedDate)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    setDraftStartDate(challenge.startDate || selectedDate)
    setDraftEndDate(challenge.endDate || selectedDate)
  }, [challenge.startDate, challenge.endDate, selectedDate])

  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => setToastMessage(''), 2400)
    return () => clearTimeout(timer)
  }, [toastMessage])

  const today = new Date().toISOString().split('T')[0]
  const weekDates = getWeekDates(compDate)
  const displayUserId = viewMode === 'mine' ? activeUser : companionId
  const displayUser = viewMode === 'mine' ? myUser : companionUser

  const workouts = getWorkoutsForDate(state, displayUserId, compDate)
  const streakNow = getStreak(state, displayUserId)
  const bestStreak = getBestStreak(state, displayUserId)
  const achievement = getAchievementProgress(state, displayUserId)

  const monthKey = compDate.slice(0, 7)
  const makeupUsage = getMakeupUsage(state, displayUserId, monthKey)
  const makeupEntries = getMakeupEntries(state, displayUserId)
  const restoredForMonth = makeupEntries.filter(entry => entry.monthKey === monthKey)

  const missedDates = getMissedChallengeDates(state, activeUser)
    .filter(date => date < compDate)
  const selectedDateWorkouts = getWorkoutsForDate(state, activeUser, compDate)
  const eligibleMakeupWorkouts = selectedDateWorkouts.filter(w => w.completed)
  const canOpenMakeupPicker = viewMode === 'mine' && eligibleMakeupWorkouts.length > 0 && missedDates.length > 0 && makeupUsage.used < 3

  function openMakeupPicker() {
    if (!canOpenMakeupPicker) return
    setSelectedMakeupWorkoutId(eligibleMakeupWorkouts[0].id)
    setSelectedMissedDate(missedDates[0])
    setShowMakeupPicker(true)
  }

  function applyMakeupDay() {
    if (!canOpenMakeupPicker || !selectedMakeupWorkoutId || !selectedMissedDate) return
    const workout = eligibleMakeupWorkouts.find(w => w.id === selectedMakeupWorkoutId)
    if (!workout) return
    dispatch({
      type: 'UPDATE_WORKOUT',
      userId: activeUser,
      date: compDate,
      workout: {
        ...workout,
        isMakeup: true,
        makeupForDate: selectedMissedDate
      }
    })
    setToastMessage(`Makeup restored for ${fmtDate(selectedMissedDate)}.`)
    setShowMakeupPicker(false)
  }

  function removeMakeupTag(entry) {
    const taggedWorkout = getWorkoutsForDate(state, activeUser, entry.workoutDate).find(w => w.id === entry.workoutId)
    if (!taggedWorkout) return
    dispatch({
      type: 'UPDATE_WORKOUT',
      userId: activeUser,
      date: entry.workoutDate,
      workout: {
        ...taggedWorkout,
        isMakeup: false,
        makeupForDate: null
      }
    })
    setToastMessage(`Makeup revoked for ${fmtDate(entry.missedDate)}.`)
  }

  function saveChallengeDates() {
    let start = draftStartDate
    let end = draftEndDate
    if (end < start) end = start
    dispatch({ type: 'UPDATE_CHALLENGE', challenge: { startDate: start, endDate: end } })
    setToastMessage('Challenge range saved.')
  }

  const dateLabel = (() => {
    if (compDate === today) return 'Today'
    const d = new Date(compDate + 'T12:00:00')
    return d.toLocaleString('default', { weekday: 'long', month: 'short', day: 'numeric' })
  })()

  return (
    <div className="companion-screen scroll-section">
      {toastMessage && <div className="companion-toast">{toastMessage}</div>}

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

      <div className="companion-insights-grid">
        {viewMode === 'mine' && (
          <div className="insight-card">
            <div className="insight-title">Challenge Settings</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
              {getChallengeLabel(challenge)}
            </div>
            <div className="challenge-settings-grid">
              <label className="challenge-settings-label">
                Start
                <input
                  className="challenge-settings-input"
                  type="date"
                  value={draftStartDate}
                  onChange={e => {
                    const nextStart = e.target.value
                    setDraftStartDate(nextStart)
                    if (draftEndDate < nextStart) setDraftEndDate(nextStart)
                  }}
                />
              </label>
              <label className="challenge-settings-label">
                End
                <input
                  className="challenge-settings-input"
                  type="date"
                  min={draftStartDate}
                  value={draftEndDate}
                  onChange={e => setDraftEndDate(e.target.value)}
                />
              </label>
            </div>
            <button className="makeup-apply-btn" onClick={saveChallengeDates}>
              Save challenge range
            </button>
          </div>
        )}

        <div className="insight-card">
          <div className="insight-title">Streak Tracker</div>
          <div className="insight-row">
            <span>Current Streak</span>
            <strong>{streakNow}🔥</strong>
          </div>
          <div className="insight-row">
            <span>Best Streak</span>
            <strong>{bestStreak}🏆</strong>
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-title">Makeup Day ⏰</div>
          <div className="insight-row">
            <span>Used ({monthKey})</span>
            <strong>{makeupUsage.used}/3</strong>
          </div>
          <div className="makeup-dots" aria-hidden="true">
            {[0, 1, 2].map(i => (
              <span key={i} className={`makeup-dot ${i < makeupUsage.used ? 'used' : ''}`} />
            ))}
          </div>
          {viewMode === 'mine' ? (
            <>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>
                Missed days available: {missedDates.length}
              </div>
              <button
                className="makeup-apply-btn"
                onClick={openMakeupPicker}
                disabled={!canOpenMakeupPicker}
              >
                {canOpenMakeupPicker
                  ? 'Open makeup picker'
                  : 'Need a completed workout, available miss, and monthly slot'}
              </button>
            </>
          ) : (
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>
              Viewing {displayUser.name}'s makeup usage
            </div>
          )}
          {restoredForMonth.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {restoredForMonth.map(entry => (
                <div key={`${entry.workoutId}-${entry.missedDate}`} className="restored-row">
                  <span>Restored {fmtDate(entry.missedDate)} using {fmtDate(entry.workoutDate)}</span>
                  {viewMode === 'mine' && (
                    <button onClick={() => removeMakeupTag(entry)}>Revoke</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="insight-card companion-achievements">
          <div className="insight-title">Achievements</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {achievement.unlockedCount}/{achievement.totalCount} unlocked
          </div>
          <div className="achievement-list">
            {achievement.achievements.map(item => (
              <div key={item.id} className={`achievement-item ${item.unlocked ? 'unlocked' : ''}`}>
                <span>{item.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: item.unlocked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{item.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
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

      {showMakeupPicker && (
        <div className="makeup-modal-overlay" onClick={() => setShowMakeupPicker(false)}>
          <div className="makeup-modal" onClick={e => e.stopPropagation()}>
            <div className="insight-title" style={{ marginBottom: 10 }}>Makeup Day Picker</div>

            <div className="makeup-picker-group">
              <div className="makeup-picker-label">Select missed day to restore</div>
              <div className="makeup-picker-list">
                {missedDates.map(date => (
                  <button
                    key={date}
                    className={`makeup-picker-item ${selectedMissedDate === date ? 'selected' : ''}`}
                    onClick={() => setSelectedMissedDate(date)}
                  >
                    {fmtDate(date)}
                  </button>
                ))}
              </div>
            </div>

            <div className="makeup-picker-group">
              <div className="makeup-picker-label">Select completed workout on {fmtDate(compDate)}</div>
              <div className="makeup-picker-list">
                {eligibleMakeupWorkouts.map(workout => (
                  <button
                    key={workout.id}
                    className={`makeup-picker-item ${selectedMakeupWorkoutId === workout.id ? 'selected' : ''}`}
                    onClick={() => setSelectedMakeupWorkoutId(workout.id)}
                  >
                    {workout.name || 'Workout'}
                  </button>
                ))}
              </div>
            </div>

            <div className="makeup-picker-actions">
              <button onClick={() => setShowMakeupPicker(false)} className="makeup-picker-cancel">
                Cancel
              </button>
              <button
                onClick={applyMakeupDay}
                className="makeup-apply-btn"
                disabled={!selectedMakeupWorkoutId || !selectedMissedDate}
                style={{ marginTop: 0 }}
              >
                Apply makeup day
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
