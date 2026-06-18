import { useEffect, useMemo } from 'react'
import { usePomodoroStore } from '../store/usePomodoroStore'

const FOCUS_SECONDS = 25 * 60
const BREAK_SECONDS = 5 * 60

const formatSeconds = (seconds: number) => {
  const safe = Math.max(0, seconds)
  const mins = Math.floor(safe / 60)
  const secs = safe % 60

  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export const usePomodoroTimer = () => {
  const phase = usePomodoroStore((state) => state.phase)
  const isRunning = usePomodoroStore((state) => state.isRunning)
  const focusRemaining = usePomodoroStore((state) => state.focusRemaining)
  const breakRemaining = usePomodoroStore((state) => state.breakRemaining)
  const tick = usePomodoroStore((state) => state.tick)

  useEffect(() => {
    if (!isRunning) {
      return
    }

    const id = window.setInterval(() => {
      tick()
    }, 1000)

    return () => {
      window.clearInterval(id)
    }
  }, [isRunning, tick])

  useEffect(() => {
    if (!isRunning) {
      return
    }

    const sync = () => {
      tick()
    }

    window.addEventListener('focus', sync)
    document.addEventListener('visibilitychange', sync)

    return () => {
      window.removeEventListener('focus', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [isRunning, tick])

  const displaySeconds = phase === 'focus' ? focusRemaining : breakRemaining
  const totalSeconds = phase === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS

  const progressPercent = useMemo(() => {
    const progress = 1 - displaySeconds / totalSeconds
    return Math.min(1, Math.max(0, progress))
  }, [displaySeconds, totalSeconds])

  return {
    displaySeconds,
    displayTime: formatSeconds(displaySeconds),
    totalDisplayTime: formatSeconds(totalSeconds),
    progressPercent,
  }
}
