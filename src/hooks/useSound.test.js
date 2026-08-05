import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSound } from './useSound.js'

function installFakeAudioContext() {
  const oscillator = { connect: vi.fn(), start: vi.fn(), stop: vi.fn(), type: '', frequency: {} }
  const gain = {
    connect: vi.fn(),
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
  }
  const ctor = vi.fn().mockImplementation(function () {
    return {
      currentTime: 0,
      destination: {},
      createOscillator: vi.fn().mockReturnValue(oscillator),
      createGain: vi.fn().mockReturnValue(gain),
    }
  })
  window.AudioContext = ctor
  return ctor
}

beforeEach(() => {
  delete window.AudioContext
  delete window.webkitAudioContext
})

describe('useSound', () => {
  it('starts enabled', () => {
    installFakeAudioContext()
    const { result } = renderHook(() => useSound())
    expect(result.current.enabled).toBe(true)
  })

  it('toggle flips enabled', () => {
    installFakeAudioContext()
    const { result } = renderHook(() => useSound())
    act(() => result.current.toggle())
    expect(result.current.enabled).toBe(false)
    act(() => result.current.toggle())
    expect(result.current.enabled).toBe(true)
  })

  it('plays a tone (creates an AudioContext) when enabled', () => {
    const ctor = installFakeAudioContext()
    const { result } = renderHook(() => useSound())
    act(() => result.current.playCorrect())
    expect(ctor).toHaveBeenCalledTimes(1)
  })

  it('plays the streak and finish tones too', () => {
    const ctor = installFakeAudioContext()
    const { result } = renderHook(() => useSound())
    act(() => result.current.playStreak())
    act(() => result.current.playWrong())
    act(() => result.current.playFinish())
    expect(ctor).toHaveBeenCalledTimes(1)
  })

  it('does not touch AudioContext when muted', () => {
    const ctor = installFakeAudioContext()
    const { result } = renderHook(() => useSound())
    act(() => result.current.toggle())
    act(() => result.current.playCorrect())
    expect(ctor).not.toHaveBeenCalled()
  })
})
