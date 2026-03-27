import React, { useState } from 'react'
import { useStore, getWorkoutsForDate } from '../store.jsx'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const DOT_COLORS = {
  white: '#f4f1e8', tan: '#c8a97e',
  lime: '#f4f1e8', teal: '#89a48d', purple: '#85745f',
  coral: '#b87963', amber: '#b79b6e', blue: '#6f7f73'
}

function buildCells(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const prevDays = new Date(year, month, 0).getDate()
  const cells = []

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevDays - i
    const m = month === 0 ? 11 : month - 1
    const y = month === 0 ? year - 1 : year
    cells.push({ date: `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`, day: d, other: true })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`, day: d, other: false })
  }
  while (cells.length < 42) {
    const d = cells.length - firstDay - daysInMonth + 1
    const m = month === 11 ? 0 : month + 1
    const y = month === 11 ? year + 1 : year
    cells.push({ date: `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`, day: d, other: true })
  }
  return cells
}

export default function MonthCalendar({ onClose }) {
  const { state, dispatch } = useStore()
  const { selectedDate, activeUser } = state
  const today = new Date().toISOString().split('T')[0]

  const init = new Date(selectedDate + 'T12:00:00')
  const [viewYear, setViewYear] = useState(init.getFullYear())
  const [viewMonth, setViewMonth] = useState(init.getMonth())

  const cells = buildCells(viewYear, viewMonth)

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }
  function pick(date) {
    dispatch({ type: 'SET_SELECTED_DATE', date })
    onClose()
  }

  return (
    /* Overlay */
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        zIndex: 300,
        display: 'flex', alignItems: 'flex-end',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.2s ease forwards'
      }}
    >
      {/* Sheet */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          background: '#181818',
          borderRadius: '26px 26px 0 0',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
          animation: 'slideUp 0.32s cubic-bezier(0.32,0.72,0,1) forwards'
        }}
      >
        {/* Handle */}
        <div style={{
          width: 38, height: 4, borderRadius: 2,
          background: 'rgba(255,255,255,0.2)',
          margin: '12px auto 0'
        }} />

        {/* Header row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px 12px'
        }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={prevMonth} style={navBtn}>‹</button>
            <button onClick={nextMonth} style={navBtn}>›</button>
          </div>
        </div>

        {/* Day-of-week labels */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7,1fr)',
          padding: '0 14px', marginBottom: 4
        }}>
          {DAY_LABELS.map(d => (
            <div key={d} style={{
              textAlign: 'center', fontSize: 10, fontWeight: 700,
              color: '#444', textTransform: 'uppercase', letterSpacing: 0.4,
              paddingBottom: 6
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7,1fr)',
          gap: 3, padding: '0 14px'
        }}>
          {cells.map(({ date, day, other }, i) => {
            const workouts = getWorkoutsForDate(state, activeUser, date)
            const dots = workouts.slice(0, 3).map(w => w.color || 'white')
            const isToday = date === today
            const isSelected = date === selectedDate

            return (
              <button
                key={i}
                onClick={() => pick(date)}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 3, padding: '6px 0 5px',
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', opacity: other ? 0.22 : 1,
                  WebkitTapHighlightColor: 'transparent',
                  borderRadius: 10
                }}
              >
                {/* Date number */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: isSelected || isToday ? 700 : 400,
                  background: isSelected ? '#ffffff' : 'transparent',
                  border: isToday && !isSelected
                    ? '2px solid rgba(255,255,255,0.65)'
                    : '2px solid transparent',
                  color: isSelected ? '#000' : '#fff',
                  transition: 'all 0.12s ease'
                }}>
                  {day}
                </div>

                {/* Dots */}
                <div style={{ display: 'flex', gap: 3, height: 5, alignItems: 'center' }}>
                  {dots.length > 0
                    ? dots.map((color, j) => (
                      <div key={j} style={{
                        width: 4, height: 4, borderRadius: '50%',
                        background: DOT_COLORS[color] || '#f4f1e8'
                      }} />
                    ))
                    : <div style={{ width: 4, height: 4 }} />
                  }
                </div>
              </button>
            )
          })}
        </div>

        {/* Save / close button */}
        <div style={{ padding: '16px 16px 0' }}>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '15px',
              background: '#fff', border: 'none',
              borderRadius: 14, fontSize: 16, fontWeight: 700,
              color: '#000', cursor: 'pointer',
              transition: 'opacity 0.15s ease'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
