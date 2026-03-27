import React, { useState } from 'react'
import { useStore, getWorkoutsForDate } from '../store.jsx'
import WorkoutCard from './WorkoutCard.jsx'
import WorkoutForm from './WorkoutForm.jsx'
import { FitnessIcon } from './FitnessIcon.jsx'

export default function DayView() {
  const { state } = useStore()
  const { selectedDate, activeUser, users } = state
  const workouts = getWorkoutsForDate(state, activeUser, selectedDate)
  const [editingWorkout, setEditingWorkout] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const totalTasks = workouts.reduce((s, w) => s + (w.exercises?.length || 0), 0)

  const label = selectedDate === today
    ? 'Today'
    : new Date(selectedDate + 'T12:00:00').toLocaleString('default', { weekday: 'long', month: 'short', day: 'numeric' })

  const summaryParts = []
  if (workouts.length) summaryParts.push(`${workouts.length} workout${workouts.length !== 1 ? 's' : ''}`)
  if (totalTasks) summaryParts.push(`${totalTasks} exercise${totalTasks !== 1 ? 's' : ''}`)

  return (
    <>
      {/* Summary line — "Today: 3 workouts, 8 exercises" */}
      <div className="px-5 pt-1.5 pb-3 text-sm font-medium text-[#999] flex-shrink-0">
        <span className="text-white font-bold">{label}</span>
        {summaryParts.length > 0
          ? <span>: {summaryParts.join(', ')}</span>
          : <span className="text-[#555]"> — no workouts yet</span>
        }
      </div>

      {/* Cards */}
      <div className="px-4 flex flex-col gap-2.5">
        {workouts.length === 0 ? (
          <div className="text-center py-12 px-5 text-[#555]">
            <div className="mb-3.5 opacity-35 inline-flex items-center justify-center">
              <FitnessIcon name={users[activeUser].emoji} size={48} />
            </div>
            <div className="text-base font-semibold text-[#888] mb-1.5">No workouts today</div>
            <div className="text-[13px] leading-relaxed">
              Tap the <span className="text-lime font-bold">+</span> button to log your first workout
            </div>
          </div>
        ) : (
          workouts.map(w => (
            <WorkoutCard
              key={w.id}
              workout={w}
              date={selectedDate}
              userId={activeUser}
              onClick={() => { setEditingWorkout(w); setShowForm(true) }}
            />
          ))
        )}

        {/* Spacer so last card isn't hidden behind FAB */}
        <div className="h-20 flex-shrink-0" />
      </div>

      {showForm && (
        <WorkoutForm
          workout={editingWorkout}
          date={selectedDate}
          userId={activeUser}
          onClose={() => { setShowForm(false); setEditingWorkout(null) }}
        />
      )}
    </>
  )
}
