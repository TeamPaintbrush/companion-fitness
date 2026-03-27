import React, { useState, useEffect, useRef } from 'react'
import { useStore, generateId, WORKOUT_COLORS, COLOR_VALUES } from '../store.jsx'

const DEFAULT = {
  name: '', startTime: '', endTime: '', location: '',
  color: 'white', notes: '', exercises: [], completed: false
}

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' })
}

function fmtTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`
}

export default function WorkoutForm({ workout, date, userId, onClose }) {
  const { dispatch } = useStore()
  const [form, setForm] = useState(workout ? { ...workout } : { ...DEFAULT })
  const [visible, setVisible] = useState(false)
  const [editingTime, setEditingTime] = useState(null) // 'start' | 'end'
  const overlayRef = useRef(null)

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  function close() {
    setVisible(false)
    setTimeout(onClose, 320)
  }

  function set(field, val) { setForm(p => ({ ...p, [field]: val })) }

  function addExercise() {
    set('exercises', [
      ...form.exercises,
      { id: generateId(), name: '', sets: '', reps: '', weight: '', duration: '', completed: false }
    ])
  }

  function updEx(id, field, val) {
    set('exercises', form.exercises.map(ex => ex.id === id ? { ...ex, [field]: val } : ex))
  }

  function removeEx(id) {
    set('exercises', form.exercises.filter(ex => ex.id !== id))
  }

  function save() {
    if (!form.name.trim()) return
    dispatch({
      type: workout ? 'UPDATE_WORKOUT' : 'ADD_WORKOUT',
      userId, date,
      workout: workout ? { ...form } : { ...form, id: generateId() }
    })
    close()
  }

  function del() {
    dispatch({ type: 'DELETE_WORKOUT', userId, date, workoutId: workout.id })
    close()
  }

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={e => e.target === overlayRef.current && close()}
        style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 200, opacity: visible ? 1 : 0,
          transition: 'opacity 0.25s ease',
          WebkitBackdropFilter: 'blur(4px)', backdropFilter: 'blur(4px)'
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 201,
        background: '#181818', borderRadius: '24px 24px 0 0',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.32s cubic-bezier(0.32,0.72,0,1)',
        maxHeight: '92dvh', display: 'flex', flexDirection: 'column',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}>
        {/* Handle */}
        <div style={{
          width: 40, height: 4, background: 'rgba(255,255,255,0.18)',
          borderRadius: 2, margin: '12px auto 0', flexShrink: 0
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', padding: '12px 20px 8px', flexShrink: 0
        }}>
          <button onClick={close} style={{
            background: 'none', border: 'none', color: '#ffffff',
            fontSize: 15, fontWeight: 600, cursor: 'pointer', padding: '4px 0',
            fontFamily: 'inherit', marginRight: 'auto'
          }}>‹ Back</button>
          <span style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            fontSize: 17, fontWeight: 700, color: '#fff'
          }}>
            {workout ? 'Edit workout' : 'New workout'}
          </span>
          <button onClick={save} disabled={!form.name.trim()} style={{
            background: 'none', border: 'none',
            color: form.name.trim() ? '#ffffff' : 'var(--text-tertiary)',
            fontSize: 15, fontWeight: 700, cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit'
          }}>Save</button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          padding: '8px 16px 24px'
        }}>

          {/* — Main field group — */}
          <FieldCard>
            {/* Workout name — large input */}
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-tertiary)', marginBottom: 6 }}>Workout</div>
              <input
                type="text" placeholder="Type of workout…"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                autoFocus={!workout}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 20, fontWeight: 600, color: form.name ? '#fff' : 'rgba(255,255,255,0.25)',
                  width: '100%', fontFamily: 'inherit'
                }}
              />
            </div>

            <Divider />

            {/* Date */}
            <FieldRow label="Date" value={fmtDate(date)} />

            <Divider />

            {/* Start / End times */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <TimeField
                  label="Starts" value={form.startTime}
                  onChange={v => set('startTime', v)}
                />
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
                <TimeField
                  label="Ends" value={form.endTime}
                  onChange={v => set('endTime', v)}
                />
              </div>
            </div>

            <Divider />

            {/* Location */}
            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-tertiary)', marginBottom: 4 }}>Location</div>
              <input
                type="text" placeholder="Home, Gym, Park…"
                value={form.location}
                onChange={e => set('location', e.target.value)}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 16, color: form.location ? '#fff' : 'rgba(255,255,255,0.3)',
                  width: '100%', fontFamily: 'inherit'
                }}
              />
            </div>
          </FieldCard>

          {/* — Color — */}
          <FieldCard style={{ marginTop: 12 }}>
            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-tertiary)', marginBottom: 12 }}>Color</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {WORKOUT_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => set('color', c)}
                    style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: COLOR_VALUES[c], border: 'none', cursor: 'pointer',
                      outline: form.color === c ? `3px solid #fff` : '3px solid transparent',
                      outlineOffset: 2,
                      transform: form.color === c ? 'scale(1.15)' : 'scale(1)',
                      transition: 'all 0.15s ease', position: 'relative'
                    }}
                  >
                    {form.color === c && (
                      <span style={{
                        position: 'absolute', inset: 0, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: 'rgba(0,0,0,0.7)'
                      }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </FieldCard>

          {/* — Exercises — */}
          <FieldCard style={{ marginTop: 12 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px'
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-tertiary)' }}>Exercises</span>
              <button
                onClick={addExercise}
                style={{
                  background: 'none', border: 'none', color: '#ffffff',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                }}
              >+ Add</button>
            </div>

            {form.exercises.length === 0 && (
              <div style={{ padding: '4px 16px 14px', fontSize: 13, color: 'var(--text-tertiary)' }}>
                No exercises yet — tap + Add
              </div>
            )}

            {form.exercises.map((ex, idx) => (
              <div key={ex.id}>
                {idx > 0 && <Divider />}
                <div style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <input
                      type="text" placeholder="Exercise name…"
                      value={ex.name}
                      onChange={e => updEx(ex.id, 'name', e.target.value)}
                      style={{
                        flex: 1, background: 'transparent', border: 'none', outline: 'none',
                        fontSize: 15, fontWeight: 600, color: '#fff', fontFamily: 'inherit'
                      }}
                    />
                    <button onClick={() => removeEx(ex.id)} style={{
                      background: 'rgba(255,107,107,0.15)', border: 'none',
                      color: '#ff6b6b', borderRadius: '50%', width: 24, height: 24,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', fontSize: 14, lineHeight: 1
                    }}>×</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                    {[
                      { field: 'sets', label: 'Sets' },
                      { field: 'reps', label: 'Reps' },
                      { field: 'weight', label: 'Weight' },
                      { field: 'duration', label: 'Mins' },
                    ].map(({ field, label }) => (
                      <div key={field} style={{ textAlign: 'center' }}>
                        <input
                          type={field === 'weight' ? 'text' : 'number'}
                          placeholder="–"
                          value={ex[field]}
                          onChange={e => updEx(ex.id, field, e.target.value)}
                          style={{
                            width: '100%', background: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8, padding: '6px 4px',
                            fontSize: 14, color: '#fff', textAlign: 'center',
                            outline: 'none', fontFamily: 'inherit'
                          }}
                        />
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </FieldCard>

          {/* — Notes — */}
          <FieldCard style={{ marginTop: 12 }}>
            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-tertiary)', marginBottom: 6 }}>Notes</div>
              <textarea
                placeholder="How did it feel? Any notes…"
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                rows={3}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 15, color: '#fff', width: '100%', resize: 'none',
                  fontFamily: 'inherit', lineHeight: 1.5
                }}
              />
            </div>
          </FieldCard>

          {/* Save button */}
          <button
            onClick={save}
            disabled={!form.name.trim()}
            style={{
              width: '100%', padding: '16px',
              background: form.name.trim() ? '#fff' : 'rgba(255,255,255,0.12)',
              border: 'none', borderRadius: 14,
              fontSize: 16, fontWeight: 700,
              color: form.name.trim() ? '#000' : 'var(--text-tertiary)',
              cursor: form.name.trim() ? 'pointer' : 'default',
              marginTop: 16, fontFamily: 'inherit',
              transition: 'all 0.15s ease'
            }}
          >
            {workout ? 'Save Changes' : 'Add Workout'}
          </button>

          {workout && (
            <button onClick={del} style={{
              width: '100%', padding: '14px', marginTop: 10,
              background: 'rgba(255,107,107,0.1)',
              border: '1px solid rgba(255,107,107,0.25)',
              borderRadius: 14, fontSize: 15, fontWeight: 600,
              color: '#ff6b6b', cursor: 'pointer', fontFamily: 'inherit'
            }}>
              Delete Workout
            </button>
          )}
        </div>
      </div>
    </>
  )
}

function FieldCard({ children, style }) {
  return (
    <div style={{
      background: '#242424', borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.07)',
      overflow: 'hidden', ...style
    }}>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginLeft: 16 }} />
}

function FieldRow({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
      <span style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 15, color: '#fff', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function TimeField({ label, value, onChange }) {
  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</div>
      <input
        type="time" value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: 'transparent', border: 'none', outline: 'none',
          fontSize: 17, fontWeight: 600, color: value ? '#fff' : 'rgba(255,255,255,0.3)',
          fontFamily: 'inherit', width: '100%', colorScheme: 'dark'
        }}
      />
    </div>
  )
}
