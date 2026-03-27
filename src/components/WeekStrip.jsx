import React, { useState, useEffect } from 'react'
import { useStore, getWorkoutsForDate } from '../store.jsx'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const DOT_COLORS = {
  white: '#f4f1e8', tan: '#c8a97e',
  lime: '#f4f1e8', teal: '#89a48d', purple: '#85745f',
  coral: '#b87963', amber: '#b79b6e', blue: '#6f7f73'
}

function getWeekDates(baseDate) {
  const d = new Date(baseDate + 'T12:00:00')
  const sunday = new Date(d)
  sunday.setDate(d.getDate() - d.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const nd = new Date(sunday)
    nd.setDate(sunday.getDate() + i)
    return nd.toISOString().split('T')[0]
  })
}

export default function WeekStrip() {
  const { state, dispatch } = useStore()
  const { selectedDate, activeUser } = state
  const today = new Date().toISOString().split('T')[0]
  const [weekBase, setWeekBase] = useState(selectedDate)
  const weekDates = getWeekDates(weekBase)

  useEffect(() => {
    if (!weekDates.includes(selectedDate)) setWeekBase(selectedDate)
  }, [selectedDate])

  function goWeek(dir) {
    const base = new Date(weekBase + 'T12:00:00')
    base.setDate(base.getDate() + dir * 7)
    const next = base.toISOString().split('T')[0]
    setWeekBase(next)
    dispatch({ type: 'SET_SELECTED_DATE', date: next })
  }

  return (
    <div style={{ padding: '0 14px 8px', flexShrink: 0 }}>
      {/* Week range nav */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8, padding: '0 2px'
      }}>
        <button onClick={() => goWeek(-1)} style={navBtn}>‹</button>
        <span style={{ fontSize: 11, color: '#555', fontWeight: 600, letterSpacing: 0.2 }}>
          {new Date(weekDates[0] + 'T12:00:00').toLocaleString('default', { month: 'short', day: 'numeric' })}
          {' – '}
          {new Date(weekDates[6] + 'T12:00:00').toLocaleString('default', { month: 'short', day: 'numeric' })}
        </span>
        <button onClick={() => goWeek(1)} style={navBtn}>›</button>
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {weekDates.map(date => {
          const d = new Date(date + 'T12:00:00')
          const isSelected = date === selectedDate
          const isToday = date === today
          const workouts = getWorkoutsForDate(state, activeUser, date)
          const dotColors = workouts.slice(0, 3).map(w => w.color || 'white')

          return (
            <button
              key={date}
              onClick={() => dispatch({ type: 'SET_SELECTED_DATE', date })}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 5, padding: '9px 2px 7px',
                borderRadius: 14,
                background: isSelected ? 'rgba(255,255,255,0.09)' : 'transparent',
                border: 'none', cursor: 'pointer',
                transition: 'background 0.15s ease',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              {/* Day label */}
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: 0.4,
                textTransform: 'uppercase',
                color: isSelected ? '#fff' : '#4a4a4a'
              }}>
                {DAY_LABELS[d.getDay()]}
              </span>

              {/* Date circle */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: isSelected || isToday ? 700 : 400,
                background: isSelected ? '#ffffff' : 'transparent',
                border: isToday && !isSelected
                  ? '2px solid rgba(255,255,255,0.65)'
                  : '2px solid transparent',
                color: isSelected ? '#000' : isToday ? '#fff' : '#fff',
                transition: 'all 0.15s ease'
              }}>
                {d.getDate()}
              </div>

              {/* Activity dots */}
              <div style={{ display: 'flex', gap: 3, height: 6, alignItems: 'center' }}>
                {dotColors.length > 0
                  ? dotColors.map((color, i) => (
                    <div key={i} style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: DOT_COLORS[color] || '#f4f1e8',
                      opacity: isSelected ? 1 : 0.75
                    }} />
                  ))
                  : <div style={{ width: 5, height: 5 }} />
                }
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const navBtn = {
  width: 28, height: 28, borderRadius: '50%',
  background: 'rgba(255,255,255,0.07)', border: 'none',
  color: '#666', cursor: 'pointer', fontSize: 18,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  lineHeight: 1, touchAction: 'manipulation'
}
