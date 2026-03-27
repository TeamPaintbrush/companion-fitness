import React, { useState, useEffect } from 'react'

export default function StatusBar() {
  const [time, setTime] = useState('')

  useEffect(() => {
    function updateTime() {
      const now = new Date()
      let h = now.getHours()
      const m = now.getMinutes().toString().padStart(2, '0')
      const ampm = h >= 12 ? 'PM' : 'AM'
      h = h % 12 || 12
      setTime(`${h}:${m}`)
    }
    updateTime()
    const id = setInterval(updateTime, 10000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="status-bar">
      <span className="time">{time || '9:41'}</span>
      <div className="icons">
        {/* Signal */}
        <svg width="16" height="12" viewBox="0 0 16 12">
          <rect x="0" y="8" width="3" height="4" rx="0.5" opacity="1"/>
          <rect x="4" y="5.5" width="3" height="6.5" rx="0.5" opacity="1"/>
          <rect x="8" y="3" width="3" height="9" rx="0.5" opacity="1"/>
          <rect x="12" y="0" width="3" height="12" rx="0.5" opacity="1"/>
        </svg>
        {/* WiFi */}
        <svg width="16" height="12" viewBox="0 0 16 12">
          <path d="M8 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/>
          <path d="M3.5 6.5A6.5 6.5 0 018 5a6.5 6.5 0 014.5 1.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M1 3.5A10.5 10.5 0 018 1.5a10.5 10.5 0 017 2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
        </svg>
        {/* Battery */}
        <svg width="25" height="12" viewBox="0 0 25 12">
          <rect x="0" y="1" width="21" height="10" rx="2.5" stroke="white" strokeWidth="1" fill="none" opacity="0.35"/>
          <rect x="1" y="2" width="18" height="8" rx="1.5" fill="white"/>
          <path d="M22 4v4a2 2 0 000-4z" fill="white" opacity="0.4"/>
        </svg>
      </div>
    </div>
  )
}
