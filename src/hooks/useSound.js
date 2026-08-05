import { useRef, useState } from 'react'

function playTone(ctx, freq, duration, type, vol, delay) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type || 'sine'
  osc.frequency.value = freq
  osc.connect(gain)
  gain.connect(ctx.destination)
  const start = ctx.currentTime + (delay || 0)
  gain.gain.setValueAtTime(vol || 0.2, start)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
  osc.start(start)
  osc.stop(start + duration)
}

export function useSound() {
  const [enabled, setEnabled] = useState(true)
  const ctxRef = useRef(null)

  const getCtx = () => {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (Ctx) ctxRef.current = new Ctx()
    }
    return ctxRef.current
  }

  const play = (tones) => {
    if (!enabled) return
    const ctx = getCtx()
    if (!ctx) return
    tones.forEach(([freq, duration, type, vol, delay]) =>
      playTone(ctx, freq, duration, type, vol, delay)
    )
  }

  return {
    enabled,
    toggle: () => setEnabled((e) => !e),
    playCorrect: () => play([[523.25, 0.12, 'sine', 0.15, 0], [783.99, 0.16, 'sine', 0.15, 0.09]]),
    playWrong: () => play([[180, 0.28, 'sawtooth', 0.1, 0]]),
    playStreak: () =>
      play([523.25, 659.25, 783.99, 1046.5].map((f, i) => [f, 0.16, 'triangle', 0.16, i * 0.09])),
    playFinish: () =>
      play(
        [523.25, 659.25, 783.99, 1046.5, 1318.5].map((f, i) => [f, 0.18, 'sine', 0.16, i * 0.08])
      ),
  }
}
