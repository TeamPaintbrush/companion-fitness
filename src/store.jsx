import React, { createContext, useContext, useReducer, useEffect } from 'react'

// ===== INITIAL STATE =====
function createInitialState() {
  return {
    setupComplete: false,
    activeUser: 0,   // which user's data is shown in the UI (0 or 1)
    myUserId: 0,     // which user THIS device is (0 = created pair, 1 = joined pair)
    pairId: null,    // 6-char shared code linking the two devices
    users: [
      { name: 'You', emoji: 'dumbbell', color: 'white' },
      { name: 'Companion', emoji: 'heart', color: 'tan' }
    ],
    challenge: {
      startDate: null,
      days: 100
    },
    workouts: {
      user0: {},
      user1: {}
    },
    selectedDate: new Date().toISOString().split('T')[0]
  }
}

// ===== LOAD FROM LOCALSTORAGE =====
function loadState() {
  const initialState = createInitialState()
  try {
    const raw = localStorage.getItem('companion-fitness-v1')
    if (!raw) return initialState
    const saved = JSON.parse(raw)
    return {
      ...initialState,
      ...saved,
      workouts: {
        user0: saved.workouts?.user0 || {},
        user1: saved.workouts?.user1 || {}
      }
    }
  } catch {
    return initialState
  }
}

// ===== REDUCER =====
function reducer(state, action) {
  switch (action.type) {
    case 'COMPLETE_SETUP':
      return {
        ...state,
        setupComplete: true,
        users: action.users,
        pairId: action.pairId || state.pairId,
        myUserId: action.myUserId ?? state.myUserId,
        challenge: {
          ...state.challenge,
          startDate: action.startDate || new Date().toISOString().split('T')[0]
        }
      }

    case 'SET_PAIR_ID':
      return { ...state, pairId: action.pairId, myUserId: action.myUserId ?? state.myUserId }

    // Merge incoming partner data without touching own data
    case 'SYNC_PARTNER': {
      const key = `user${action.partnerId}`
      return {
        ...state,
        workouts: { ...state.workouts, [key]: action.workouts },
        users: state.users.map((u, i) =>
          i === action.partnerId && action.userProfile ? { ...u, ...action.userProfile } : u
        )
      }
    }

    case 'SET_ACTIVE_USER':
      return { ...state, activeUser: action.userId }

    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.date }

    case 'ADD_WORKOUT': {
      const key = `user${action.userId}`
      const dateWorkouts = state.workouts[key][action.date] || []
      return {
        ...state,
        workouts: {
          ...state.workouts,
          [key]: {
            ...state.workouts[key],
            [action.date]: [...dateWorkouts, action.workout]
          }
        }
      }
    }

    case 'UPDATE_WORKOUT': {
      const key = `user${action.userId}`
      const dateWorkouts = (state.workouts[key][action.date] || []).map(w =>
        w.id === action.workout.id ? action.workout : w
      )
      return {
        ...state,
        workouts: {
          ...state.workouts,
          [key]: {
            ...state.workouts[key],
            [action.date]: dateWorkouts
          }
        }
      }
    }

    case 'DELETE_WORKOUT': {
      const key = `user${action.userId}`
      const filtered = (state.workouts[key][action.date] || []).filter(
        w => w.id !== action.workoutId
      )
      return {
        ...state,
        workouts: {
          ...state.workouts,
          [key]: {
            ...state.workouts[key],
            [action.date]: filtered
          }
        }
      }
    }

    case 'TOGGLE_EXERCISE_COMPLETE': {
      const key = `user${action.userId}`
      const dateWorkouts = (state.workouts[key][action.date] || []).map(w => {
        if (w.id !== action.workoutId) return w
        return {
          ...w,
          exercises: w.exercises.map(ex =>
            ex.id === action.exerciseId ? { ...ex, completed: !ex.completed } : ex
          )
        }
      })
      return {
        ...state,
        workouts: {
          ...state.workouts,
          [key]: {
            ...state.workouts[key],
            [action.date]: dateWorkouts
          }
        }
      }
    }

    case 'TOGGLE_WORKOUT_COMPLETE': {
      const key = `user${action.userId}`
      const dateWorkouts = (state.workouts[key][action.date] || []).map(w =>
        w.id === action.workoutId ? { ...w, completed: !w.completed } : w
      )
      return {
        ...state,
        workouts: {
          ...state.workouts,
          [key]: {
            ...state.workouts[key],
            [action.date]: dateWorkouts
          }
        }
      }
    }

    case 'UPDATE_USERS':
      return { ...state, users: action.users }

    case 'UPDATE_CHALLENGE':
      return {
        ...state,
        challenge: { ...state.challenge, ...action.challenge }
      }

    case 'RESET_CHALLENGE':
      return {
        ...state,
        challenge: {
          startDate: new Date().toISOString().split('T')[0],
          days: 100
        },
        workouts: { user0: {}, user1: {} }
      }

    case 'FULL_RESET_APP':
      return createInitialState()

    default:
      return state
  }
}

// ===== CONTEXT =====
const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadState)

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('companion-fitness-v1', JSON.stringify(state))
    } catch {}
  }, [state])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useStore must be used within AppProvider')
  return ctx
}

// ===== HELPERS =====
export function getWorkoutsForDate(state, userId, date) {
  return state.workouts[`user${userId}`][date] || []
}

export function getDatesWithWorkouts(state, userId) {
  return Object.keys(state.workouts[`user${userId}`]).filter(
    date => (state.workouts[`user${userId}`][date] || []).length > 0
  )
}

export function getChallengeDay(startDate, date) {
  if (!startDate) return null
  const start = new Date(startDate)
  const target = new Date(date)
  start.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diff = Math.floor((target - start) / (1000 * 60 * 60 * 24))
  if (diff < 0 || diff >= 100) return null
  return diff + 1
}

export function getStreak(state, userId) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let streak = 0
  let current = new Date(today)

  while (true) {
    const dateStr = current.toISOString().split('T')[0]
    const workouts = state.workouts[`user${userId}`][dateStr] || []
    if (workouts.length === 0) {
      if (current.getTime() === today.getTime()) {
        current.setDate(current.getDate() - 1)
        continue
      }
      break
    }
    streak++
    current.setDate(current.getDate() - 1)
    if (streak > 100) break
  }
  return streak
}

export function getCompletedDaysCount(state, userId, startDate) {
  if (!startDate) return 0
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const userWorkouts = state.workouts[`user${userId}`]
  let count = 0

  Object.keys(userWorkouts).forEach(date => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    const diff = Math.floor((d - start) / (1000 * 60 * 60 * 24))
    if (diff >= 0 && diff < 100 && userWorkouts[date].length > 0) {
      count++
    }
  })
  return count
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const WORKOUT_COLORS = ['white', 'tan', 'teal', 'amber', 'coral', 'blue', 'purple']

export const COLOR_VALUES = {
  white: '#f4f1e8',
  tan: '#c8a97e',
  lime: '#f4f1e8',
  teal: '#89a48d',
  purple: '#85745f',
  coral: '#b87963',
  amber: '#b79b6e',
  blue: '#6f7f73'
}

export const EMOJIS = ['dumbbell', 'running', 'bike', 'heart', 'flame', 'spark', 'target', 'shield', 'waves', 'mountain', 'footprints', 'trophy']
