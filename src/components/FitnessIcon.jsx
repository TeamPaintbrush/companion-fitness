import React from 'react'
import {
  Activity,
  Bike,
  Dumbbell,
  Flame,
  Footprints,
  HeartPulse,
  Link2,
  Mountain,
  PersonStanding,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Waves
} from 'lucide-react'

const ICON_MAP = {
  dumbbell: Dumbbell,
  running: PersonStanding,
  bike: Bike,
  heart: HeartPulse,
  flame: Flame,
  spark: Sparkles,
  target: Target,
  shield: Shield,
  waves: Waves,
  mountain: Mountain,
  footprints: Footprints,
  trophy: Trophy,
  activity: Activity,
  link: Link2
}

export function FitnessIcon({ name = 'dumbbell', size = 18, color = '#ffffff', strokeWidth = 2.2 }) {
  const Icon = ICON_MAP[name] || Dumbbell
  return <Icon size={size} color={color} strokeWidth={strokeWidth} aria-hidden="true" />
}
