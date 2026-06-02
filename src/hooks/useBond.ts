'use client'

import { useState, useCallback, useRef } from 'react'

export type BondTier = 'stranger' | 'familiar' | 'intimate'

interface UseBondOptions {
  initialLevel?: number
  tierNames?: string[]
}

export function useBond({ initialLevel = 20, tierNames = ['初识', '渐熟', '知己'] }: UseBondOptions = {}) {
  const [bondLevel, setBondLevel] = useState(initialLevel)
  const [bondDelta, setBondDelta] = useState<number | null>(null)
  const [showMilestone, setShowMilestone] = useState<string | null>(null)
  const [milestonesAchieved, setMilestonesAchieved] = useState<string[]>([])
  const bondStartRef = useRef(initialLevel)

  const bondTier: BondTier = bondLevel < 30 ? 'stranger' : bondLevel < 60 ? 'familiar' : 'intimate'
  const tierIndex = bondTier === 'intimate' ? 2 : bondTier === 'familiar' ? 1 : 0
  const tierName = tierNames[tierIndex] || ['初识', '渐熟', '知己'][tierIndex]
  const tierColor = bondTier === 'intimate' ? '#f472b6' : bondTier === 'familiar' ? '#60a5fa' : '#9ca3af'

  const handleBondChange = useCallback((delta: number) => {
    setBondLevel(prev => Math.max(0, Math.min(100, prev + delta)))
    setBondDelta(delta)
    setTimeout(() => setBondDelta(null), 1200)
  }, [])

  const handleMilestone = useCallback((name: string) => {
    if (milestonesAchieved.includes(name)) return
    setMilestonesAchieved(prev => [...prev, name])
    setShowMilestone(name)
    setTimeout(() => setShowMilestone(null), 2500)
  }, [milestonesAchieved])

  return {
    bondLevel,
    bondTier,
    tierName,
    tierColor,
    tierIndex,
    bondDelta,
    showMilestone,
    milestonesAchieved,
    bondStart: bondStartRef.current,
    handleBondChange,
    handleMilestone,
  }
}
