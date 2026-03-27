import React, { useState } from 'react'
import { AppProvider, useStore } from './store.jsx'
import { useSync } from './hooks/useSync.js'
import StatusBar from './components/StatusBar.jsx'
import Header from './components/Header.jsx'
import WeekStrip from './components/WeekStrip.jsx'
import DayView from './components/DayView.jsx'
import WorkoutForm from './components/WorkoutForm.jsx'
import MonthCalendar from './components/MonthCalendar.jsx'
import Challenge100 from './components/Challenge100.jsx'
import CompanionView from './components/CompanionView.jsx'
import ProfileTab from './components/ProfileTab.jsx'
import TabBar from './components/TabBar.jsx'
import UserSetup from './components/UserSetup.jsx'
import { FitnessIcon } from './components/FitnessIcon.jsx'

// Sync status dot shown next to the month title
const STATUS_DOT = {
  idle:    { color: '#555',    title: 'Not syncing' },
  syncing: { color: '#fbbf24', title: 'Syncing…' },
  live:    { color: '#60a5fa', title: 'Live' },
  error:   { color: '#ff6b6b', title: 'Sync error' }
}

function AppContent() {
  const { state, dispatch } = useStore()
  const syncStatus = useSync(state, dispatch)

  const [activeTab, setActiveTab]       = useState('home')
  const [showCalendar, setShowCalendar] = useState(false)
  const [showAddWorkout, setShowAddWorkout] = useState(false)
  const [tabKey, setTabKey]             = useState(0)

  function handleTabChange(tab) {
    setActiveTab(tab)
    setTabKey(k => k + 1)
  }

  if (!state.setupComplete) return <UserSetup />

  const dot = STATUS_DOT[syncStatus] || STATUS_DOT.idle

  return (
    <div className="app-shell">
      <StatusBar />

      <div className="screen-content" key={tabKey}>
        {activeTab === 'home' && (
          <div className="tab-enter">
            <Header onCalendarOpen={() => setShowCalendar(true)} syncDot={dot} />
            <WeekStrip />
            <DayView />
          </div>
        )}

        {activeTab === 'challenge' && (
          <div className="tab-enter">
            <div style={{ padding: '12px 20px 4px' }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>100-Day Challenge</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <FitnessIcon name={state.users[state.activeUser].emoji} size={14} />
                  {state.users[state.activeUser].name}'s journey
                </span>
              </p>
            </div>
            <Challenge100 />
          </div>
        )}

        {activeTab === 'companion' && (
          <div className="tab-enter">
            <div style={{ padding: '12px 20px 4px' }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>Companion</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Compare workouts with your partner
              </p>
            </div>
            <CompanionView />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="tab-enter">
            <div style={{ padding: '12px 20px 4px' }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>Profile</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Settings & preferences
              </p>
            </div>
            <ProfileTab />
          </div>
        )}
      </div>

      {activeTab === 'home' && (
        <button className="fab" onClick={() => setShowAddWorkout(true)} aria-label="Add workout">+</button>
      )}

      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />

      {showCalendar && <MonthCalendar onClose={() => setShowCalendar(false)} />}

      {showAddWorkout && (
        <WorkoutForm
          workout={null}
          date={state.selectedDate}
          userId={state.activeUser}
          onClose={() => setShowAddWorkout(false)}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
