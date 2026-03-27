import React from 'react'
import { useStore } from '../store.jsx'

const COLOR_MAP = {
  white:  { bg: '#f4f1e8', accent: '#f4f1e8', text: '#111111', emptyBg: 'rgba(244,241,232,0.14)' },
  tan:    { bg: '#c8a97e', accent: '#c8a97e', text: '#111111', emptyBg: 'rgba(200,169,126,0.14)' },
  lime:   { bg: '#f4f1e8', accent: '#f4f1e8', text: '#111111', emptyBg: 'rgba(244,241,232,0.14)' },
  teal:   { bg: '#89a48d', accent: '#89a48d', text: '#111111', emptyBg: 'rgba(137,164,141,0.14)' },
  purple: { bg: '#85745f', accent: '#85745f', text: '#f5f5f5', emptyBg: 'rgba(133,116,95,0.16)' },
  coral:  { bg: '#b87963', accent: '#b87963', text: '#111111', emptyBg: 'rgba(184,121,99,0.14)' },
  amber:  { bg: '#b79b6e', accent: '#b79b6e', text: '#111111', emptyBg: 'rgba(183,155,110,0.14)' },
  blue:   { bg: '#6f7f73', accent: '#6f7f73', text: '#f5f5f5', emptyBg: 'rgba(111,127,115,0.16)' },
}

export default function WorkoutCard({ workout, date, userId, onClick }) {
  const { dispatch } = useStore()
  const color = COLOR_MAP[workout.color] || COLOR_MAP.white

  const totalEx = workout.exercises?.length || 0
  const doneEx  = workout.exercises?.filter(e => e.completed).length || 0

  function toggleComplete(e) {
    e.stopPropagation()
    dispatch({ type: 'TOGGLE_WORKOUT_COMPLETE', userId, date, workoutId: workout.id })
  }

  const hasTime = workout.startTime || workout.endTime
  const timeStr = [workout.startTime, workout.endTime].filter(Boolean).join(' – ')

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'stretch',
        background: '#1e1e1e', borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.07)',
        overflow: 'hidden', cursor: 'pointer',
        transition: 'transform 0.12s ease, background 0.12s ease',
        animation: 'cardIn 0.22s ease forwards',
        opacity: workout.completed ? 0.65 : 1,
        minHeight: 86
      }}
      onTouchStart={e => e.currentTarget.style.transform = 'scale(0.985)'}
      onTouchEnd={e => e.currentTarget.style.transform = ''}
    >
      {/* Left accent stripe */}
      <div style={{ width: 4, background: color.accent, flexShrink: 0, borderRadius: '16px 0 0 16px', opacity: 0.6 }} />

      {/* Card body */}
      <div style={{ flex: 1, padding: '14px 12px 14px 14px', minWidth: 0 }}>
        {hasTime && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {timeStr}
          </div>
        )}

        <div style={{
          fontSize: 16, fontWeight: 700, color: '#fff',
          letterSpacing: -0.2, marginBottom: workout.location ? 6 : 0,
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          {workout.completed && (
            <span style={{ color: color.accent, fontSize: 13 }}>✓</span>
          )}
          {workout.name || 'Workout'}
        </div>

        {workout.location && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, color: 'var(--text-tertiary)'
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {workout.location}
          </div>
        )}

        {totalEx > 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 5 }}>
            {workout.exercises.slice(0, 2).map(ex => ex.name).filter(Boolean).join(' · ')}
            {totalEx > 2 && ` +${totalEx - 2}`}
          </div>
        )}
      </div>

      {/* Right badge */}
      <div
        onClick={toggleComplete}
        style={{
          minWidth: 72, flexShrink: 0,
          background: totalEx > 0 ? color.bg : color.emptyBg,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '12px 10px', gap: 3,
          cursor: 'pointer',
          borderRadius: '0 16px 16px 0',
          transition: 'background 0.2s ease'
        }}
      >
        {totalEx > 0 ? (
          <>
            <span style={{ fontSize: 22, fontWeight: 800, color: color.text, lineHeight: 1 }}>
              {doneEx}/{totalEx}
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: color.text, opacity: 0.7 }}>
              Tasks{'\n'}done
            </span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 26, fontWeight: 300, color: color.accent, lineHeight: 1 }}>+</span>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: color.accent, opacity: 0.8 }}>
              Add task
            </span>
          </>
        )}
      </div>
    </div>
  )
}
