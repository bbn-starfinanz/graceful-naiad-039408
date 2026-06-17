import confetti from 'canvas-confetti'

let audioContext: AudioContext | null = null

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new AudioContext()
  }

  return audioContext
}

export const playUiClick = (frequency = 760) => {
  const ctx = getAudioContext()
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'triangle'
  osc.frequency.setValueAtTime(frequency, now)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.12)
}

export const burstAtElement = (element: HTMLElement | null) => {
  if (!element) {
    return
  }

  const rect = element.getBoundingClientRect()
  const x = (rect.left + rect.width / 2) / window.innerWidth
  const y = (rect.top + rect.height / 2) / window.innerHeight

  confetti({
    particleCount: 22,
    spread: 34,
    startVelocity: 18,
    gravity: 1.2,
    scalar: 0.75,
    origin: { x, y },
    ticks: 120,
    colors: ['#40c3a4', '#9ae6cf', '#ffe4b5', '#f6fdff'],
  })
}
