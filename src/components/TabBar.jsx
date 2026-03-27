import React from 'react'

const TABS = [
  {
    id: 'home',
    label: 'Home',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 12L12 3L21 12V20C21 20.5523 20.5523 21 20 21H15V16H9V21H4C3.44772 21 3 20.5523 3 20V12Z"
          stroke={active ? '#fff' : 'rgba(255,255,255,0.3)'}
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill={active ? 'rgba(255,255,255,0.12)' : 'none'}
        />
      </svg>
    )
  },
  {
    id: 'challenge',
    label: 'Challenge',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5"
          fill={active ? 'rgba(255,255,255,0.12)' : 'none'}
          stroke={active ? '#fff' : 'rgba(255,255,255,0.3)'} strokeWidth="1.8"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"
          fill={active ? 'rgba(255,255,255,0.12)' : 'none'}
          stroke={active ? '#fff' : 'rgba(255,255,255,0.3)'} strokeWidth="1.8"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"
          fill={active ? 'rgba(255,255,255,0.18)' : 'none'}
          stroke={active ? '#fff' : 'rgba(255,255,255,0.3)'} strokeWidth="1.8"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"
          fill={active ? 'rgba(255,255,255,0.06)' : 'none'}
          stroke={active ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)'} strokeWidth="1.8"/>
      </svg>
    )
  },
  {
    id: 'companion',
    label: 'Companion',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="8" r="3"
          stroke={active ? '#fff' : 'rgba(255,255,255,0.3)'} strokeWidth="1.8"
          fill={active ? 'rgba(255,255,255,0.12)' : 'none'}/>
        <circle cx="16" cy="8" r="3"
          stroke={active ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)'} strokeWidth="1.8"
          fill="none"/>
        <path d="M3 20C3 17 5.686 15 9 15C12.314 15 15 17 15 20"
          stroke={active ? '#fff' : 'rgba(255,255,255,0.3)'} strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M16 15C18.761 15 21 16.5 21 20"
          stroke={active ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4"
          stroke={active ? '#fff' : 'rgba(255,255,255,0.3)'} strokeWidth="1.8"
          fill={active ? 'rgba(255,255,255,0.12)' : 'none'}/>
        <path d="M4 20C4 17 7.582 15 12 15C16.418 15 20 17 20 20"
          stroke={active ? '#fff' : 'rgba(255,255,255,0.3)'} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    )
  }
]

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <div className="tab-bar">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`tab-bar-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon(activeTab === tab.id)}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
