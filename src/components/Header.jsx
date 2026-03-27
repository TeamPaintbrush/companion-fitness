import React from 'react'
import { useStore } from '../store.jsx'
import { FitnessIcon } from './FitnessIcon.jsx'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

export default function Header({ onCalendarOpen, syncDot }) {
  const { state, dispatch } = useStore()
  const { users, activeUser, selectedDate } = state
  const date = new Date(selectedDate + 'T12:00:00')

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '2px 20px 10px', flexShrink: 0
    }}>
      {/* Month title + calendar icon */}
      <button
        onClick={onCalendarOpen}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-1px', lineHeight: 1 }}>
            {MONTHS[date.getMonth()]}
          </span>
          {syncDot && (
            <span
              title={syncDot.title}
              style={{ width: 8, height: 8, borderRadius: '50%', background: syncDot.color, flexShrink: 0, transition: 'background 0.4s ease' }}
            />
          )}
        </span>
        <span style={{
          width: 30, height: 30, borderRadius: 9,
          background: 'rgba(255,255,255,0.09)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}><FitnessIcon name="activity" size={15} /></span>
      </button>

      {/* User avatar switcher */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {users.map((u, i) => (
          <button
            key={i}
            onClick={() => dispatch({ type: 'SET_ACTIVE_USER', userId: i })}
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: activeUser === i ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.07)',
              border: `2px solid ${activeUser === i ? '#fff' : 'transparent'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, cursor: 'pointer',
              transition: 'all 0.15s ease', flexShrink: 0
            }}
            title={u.name}
          >
            <FitnessIcon name={u.emoji} size={18} color="#f5f5f5" />
          </button>
        ))}
      </div>
    </div>
  )
}
