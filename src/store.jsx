import React, { createContext, useContext, useReducer, useEffect } from 'react'

function toDateOnly(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T12:00:00')
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateStr(date) {
  return date.toISOString().split('T')[0]
}

function addDays(dateStr, daysToAdd) {
  const base = toDateOnly(dateStr)
  if (!base) return null
  base.setDate(base.getDate() + daysToAdd)
  return toDateStr(base)
}

function getDaysBetween(startDate, endDate) {
  const start = toDateOnly(startDate)
  const end = toDateOnly(endDate)
  if (!start || !end) return 0
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1
}

function normalizeChallenge(challenge = {}) {
  const startDate = challenge.startDate || new Date().toISOString().split('T')[0]
  let endDate = challenge.endDate
  if (!endDate) {
    const fallbackDays = Number(challenge.days) > 0 ? Number(challenge.days) : 100
    endDate = addDays(startDate, fallbackDays - 1)
  }

  const dayCount = getDaysBetween(startDate, endDate)
  if (!dayCount || dayCount < 1) {
    const correctedEnd = addDays(startDate, 99)
    return { startDate, endDate: correctedEnd, days: 100 }
  }

  return { startDate, endDate, days: dayCount }
}

function getChallengeDates(challenge) {
  const normalized = normalizeChallenge(challenge)
  const list = []
  let cursor = toDateOnly(normalized.startDate)
  const end = toDateOnly(normalized.endDate)
  while (cursor && end && cursor <= end) {
    list.push(toDateStr(cursor))
    cursor = new Date(cursor)
    cursor.setDate(cursor.getDate() + 1)
  }
  return list
}

function getUserWorkoutsMap(state, userId) {
  return state.workouts[`user${userId}`] || {}
}

function hasWorkoutLogOnDate(state, userId, date) {
  const workouts = getUserWorkoutsMap(state, userId)[date] || []
  return workouts.length > 0
}

function getValidatedMakeupEntries(state, userId) {
  const entries = []
  const userWorkouts = getUserWorkoutsMap(state, userId)

  Object.keys(userWorkouts).forEach(date => {
    const workouts = userWorkouts[date] || []
    workouts.forEach(workout => {
      if (!workout?.isMakeup || !workout?.makeupForDate) return
      if (!workout.completed) return
      if (!workout.id) return
      if (workout.makeupForDate >= date) return
      entries.push({
        workoutId: workout.id,
        workoutDate: date,
        missedDate: workout.makeupForDate,
        monthKey: date.slice(0, 7)
      })
    })
  })

  entries.sort((a, b) => {
    if (a.workoutDate === b.workoutDate) return a.workoutId.localeCompare(b.workoutId)
    return a.workoutDate.localeCompare(b.workoutDate)
  })

  const valid = []
  const monthCounts = {}
  const restoredMissed = new Set()

  for (const entry of entries) {
    if (restoredMissed.has(entry.missedDate)) continue
    const usedThisMonth = monthCounts[entry.monthKey] || 0
    if (usedThisMonth >= 3) continue
    monthCounts[entry.monthKey] = usedThisMonth + 1
    restoredMissed.add(entry.missedDate)
    valid.push(entry)
  }

  return valid
}

function getRestoredDatesSet(state, userId) {
  return new Set(getValidatedMakeupEntries(state, userId).map(entry => entry.missedDate))
}

function isChallengeDayCompleted(state, userId, date) {
  if (hasWorkoutLogOnDate(state, userId, date)) return true
  return getRestoredDatesSet(state, userId).has(date)
}

function getChallengeSummary(state, userId) {
  const challengeDates = getChallengeDates(state.challenge)
  const today = toDateOnly(new Date().toISOString().split('T')[0])
  const restored = getRestoredDatesSet(state, userId)

  const completedDates = []
  const missedDates = []

  challengeDates.forEach(date => {
    const d = toDateOnly(date)
    if (!d || d > today) return
    if (hasWorkoutLogOnDate(state, userId, date) || restored.has(date)) completedDates.push(date)
    else missedDates.push(date)
  })

  return {
    challengeDates,
    completedDates,
    missedDates,
    restoredDates: [...restored]
  }
}

function getStreakFromDates(dateSet, startDate, endDate, includeTodayWindow = true) {
  const start = toDateOnly(startDate)
  const end = toDateOnly(endDate)
  if (!start || !end || end < start) return 0

  const today = toDateOnly(new Date().toISOString().split('T')[0])
  let cursor = new Date(end)

  if (includeTodayWindow && cursor.getTime() === today.getTime() && !dateSet.has(toDateStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
  }

  let streak = 0
  while (cursor >= start) {
    const date = toDateStr(cursor)
    if (!dateSet.has(date)) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function getBestStreakFromDates(dateSet, startDate, endDate) {
  const start = toDateOnly(startDate)
  const end = toDateOnly(endDate)
  if (!start || !end || end < start) return 0

  let best = 0
  let run = 0
  let cursor = new Date(start)

  while (cursor <= end) {
    const date = toDateStr(cursor)
    if (dateSet.has(date)) {
      run++
      if (run > best) best = run
    } else {
      run = 0
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return best
}

// ===== INITIAL STATE =====
function createInitialState() {
  return {
    setupComplete: false,
    activeUser: 0,   // which user's data is shown in the UI (0 or 1)
    myUserId: 0,     // which user THIS device is (0 = created pair, 1 = joined pair)
    pairId: null,    // 6-char shared code linking the two devices
    pairSecret: null,
    users: [
      { name: 'You', emoji: 'dumbbell', color: 'white' },
      { name: 'Companion', emoji: 'heart', color: 'tan' }
    ],
    challenge: {
      startDate: null,
      endDate: null,
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
      pairSecret: saved.pairSecret || saved.pairId || null,
      challenge: normalizeChallenge({ ...initialState.challenge, ...(saved.challenge || {}) }),
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
        pairSecret: action.pairSecret || state.pairSecret,
        myUserId: action.myUserId ?? state.myUserId,
        challenge: normalizeChallenge({
          ...state.challenge,
          startDate: action.startDate || new Date().toISOString().split('T')[0],
          endDate: action.endDate || state.challenge.endDate,
          days: action.days || state.challenge.days
        })
      }

    case 'SET_PAIR_ID':
      return {
        ...state,
        pairId: action.pairId,
        pairSecret: action.pairSecret || state.pairSecret,
        myUserId: action.myUserId ?? state.myUserId
      }

    // Merge incoming partner data without touching own data
    case 'SYNC_PARTNER': {
      const key = `user${action.partnerId}`
      const newState = {
        ...state,
        workouts: { ...state.workouts, [key]: action.workouts },
        users: state.users.map((u, i) =>
          i === action.partnerId && action.userProfile ? { ...u, ...action.userProfile } : u
        )
      }
      // Joiner device (myUserId=1) trusts the creator's (user0) challenge dates
      if (action.partnerId === 0 && state.myUserId === 1 && action.challenge) {
        newState.challenge = normalizeChallenge(action.challenge)
      }
      return newState
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
        challenge: normalizeChallenge({ ...state.challenge, ...action.challenge })
      }

    case 'RESET_CHALLENGE':
      return {
        ...state,
        challenge: normalizeChallenge({ startDate: new Date().toISOString().split('T')[0], days: 100 }),
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
  const challenge = typeof startDate === 'string' ? normalizeChallenge({ startDate }) : normalizeChallenge(startDate)
  if (!challenge.startDate) return null
  const start = new Date(challenge.startDate)
  const target = new Date(date)
  start.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diff = Math.floor((target - start) / (1000 * 60 * 60 * 24))
  if (diff < 0 || diff >= challenge.days) return null
  return diff + 1
}

export function getStreak(state, userId) {
  const challenge = normalizeChallenge(state.challenge)
  const today = new Date().toISOString().split('T')[0]
  const cappedEnd = challenge.endDate < today ? challenge.endDate : today
  const dateSet = new Set(getChallengeSummary(state, userId).completedDates)
  return getStreakFromDates(dateSet, challenge.startDate, cappedEnd, true)
}

export function getBestStreak(state, userId) {
  const challenge = normalizeChallenge(state.challenge)
  const today = new Date().toISOString().split('T')[0]
  const cappedEnd = challenge.endDate < today ? challenge.endDate : today
  const dateSet = new Set(getChallengeSummary(state, userId).completedDates)
  return getBestStreakFromDates(dateSet, challenge.startDate, cappedEnd)
}

export function getCompletedDaysCount(state, userId, startDate) {
  const challenge = normalizeChallenge({ ...state.challenge, startDate })
  const summary = getChallengeSummary({ ...state, challenge }, userId)
  return summary.completedDates.length
}

export function getMissedChallengeDates(state, userId) {
  return getChallengeSummary(state, userId).missedDates
}

export function getMakeupUsage(state, userId, monthKey) {
  const entries = getValidatedMakeupEntries(state, userId)
  const used = entries.filter(entry => entry.monthKey === monthKey).length
  return { used, remaining: Math.max(0, 3 - used) }
}

export function getMakeupEntries(state, userId) {
  return getValidatedMakeupEntries(state, userId)
}

export function getAchievementProgress(state, userId) {
  const userWorkouts = getUserWorkoutsMap(state, userId)
  const challenge = normalizeChallenge(state.challenge)
  const summary = getChallengeSummary(state, userId)
  const completedDays = summary.completedDates.length
  const currentStreak = getStreak(state, userId)
  const bestStreak = getBestStreak(state, userId)
  const makeupEntries = getValidatedMakeupEntries(state, userId)

  let totalWorkouts = 0
  let completedWorkouts = 0
  let totalExercises = 0
  let completedExercises = 0

  Object.values(userWorkouts).forEach(day => {
    totalWorkouts += day.length
    completedWorkouts += day.filter(w => w.completed).length
    day.forEach(workout => {
      const exercises = workout.exercises || []
      totalExercises += exercises.length
      completedExercises += exercises.filter(ex => ex.completed).length
    })
  })

  const activeDays = Object.keys(userWorkouts).filter(date => (userWorkouts[date] || []).length > 0).length

  const completedByMonth = {}
  summary.completedDates.forEach(date => {
    const key = date.slice(0, 7)
    completedByMonth[key] = (completedByMonth[key] || 0) + 1
  })
  const maxMonthlyCompletions = Math.max(0, ...Object.values(completedByMonth))

  const makeupByMonth = {}
  makeupEntries.forEach(entry => {
    makeupByMonth[entry.monthKey] = (makeupByMonth[entry.monthKey] || 0) + 1
  })
  const maxMakeupsInSingleMonth = Math.max(0, ...Object.values(makeupByMonth))

  const completionRate = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0

  const achievements = [
    {
      id: 'first-log',
      icon: '🎯',
      title: 'First Log',
      description: 'Log your first workout.',
      unlocked: totalWorkouts >= 1
    },
    {
      id: 'streak-7',
      icon: '🔥',
      title: 'Heat Wave',
      description: 'Reach a 7-day streak.',
      unlocked: bestStreak >= 7
    },
    {
      id: 'streak-14',
      icon: '⚡',
      title: 'Unbreakable',
      description: 'Reach a 14-day streak.',
      unlocked: bestStreak >= 14
    },
    {
      id: 'streak-30',
      icon: '🌋',
      title: 'Inferno Month',
      description: 'Reach a 30-day streak.',
      unlocked: bestStreak >= 30
    },
    {
      id: 'complete-25',
      icon: '💪',
      title: 'Finisher Mindset',
      description: 'Complete 25 workouts.',
      unlocked: completedWorkouts >= 25
    },
    {
      id: 'complete-50',
      icon: '🧱',
      title: 'Built Different',
      description: 'Complete 50 workouts.',
      unlocked: completedWorkouts >= 50
    },
    {
      id: 'active-days-20',
      icon: '📅',
      title: 'Consistency Crew',
      description: 'Log workouts on 20 different days.',
      unlocked: activeDays >= 20
    },
    {
      id: 'exercise-100',
      icon: '🏋️',
      title: 'Volume Hunter',
      description: 'Log 100 exercises total.',
      unlocked: totalExercises >= 100
    },
    {
      id: 'accuracy-80',
      icon: '✅',
      title: 'Precision Grind',
      description: 'Keep exercise completion at 80% or higher (min 40 logged).',
      unlocked: totalExercises >= 40 && completionRate >= 80
    },
    {
      id: 'month-20',
      icon: '📈',
      title: 'Momentum Month',
      description: 'Complete 20 challenge days in a single month.',
      unlocked: maxMonthlyCompletions >= 20
    },
    {
      id: 'makeup-master',
      icon: '⏰',
      title: 'Comeback Mode',
      description: 'Use all 3 makeup days in a month.',
      unlocked: maxMakeupsInSingleMonth >= 3
    },
    {
      id: 'challenge-complete',
      icon: '🏆',
      title: 'Challenge Champion',
      description: `Complete all ${challenge.days} challenge days.`,
      unlocked: completedDays >= challenge.days
    }
  ]

  return {
    achievements,
    unlockedCount: achievements.filter(a => a.unlocked).length,
    totalCount: achievements.length,
    currentStreak,
    bestStreak,
    completedDays
  }
}

export function getChallengeLabel(challenge) {
  const normalized = normalizeChallenge(challenge)
  return `${normalized.days}-Day Challenge`
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
