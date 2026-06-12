import { useEffect, useRef } from 'react'

/**
 * Hands-free wake: detects a DOUBLE-CLAP (two sharp sounds in quick
 * succession) and calls onDoubleClap — so the user can summon the
 * assistant without pressing any key.
 *
 * Pure Web Audio (RMS transient detection), no models or libraries.
 * Keep it enabled only while idle so it doesn't fight the recorder for
 * the microphone.
 */
export function useClapListener(enabled: boolean, onDoubleClap: () => void) {
  const cbRef = useRef(onDoubleClap)
  cbRef.current = onDoubleClap

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let audioCtx: AudioContext | null = null
    let stream: MediaStream | null = null
    let raf = 0

    let armed = true          // ready to register the next sharp sound
    let lastClapAt = 0        // time of the first clap of a potential pair
    let lastTriggerAt = 0     // for cooldown after a successful double-clap

    // Tuned for hand claps: a clap is a brief, loud transient that decays fast.
    const THRESH = 0.2        // loudness that counts as a clap (0..1 RMS)
    const FLOOR = 0.07        // must fall below this before the next clap arms
    const MIN_GAP = 120       // ms — ignore the same clap's echo
    const MAX_GAP = 750       // ms — the two claps must be within this window
    const COOLDOWN = 1600     // ms — ignore sounds right after triggering

    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false } })
      .then((s) => {
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return }
        stream = s
        audioCtx = new AudioContext()
        const source = audioCtx.createMediaStreamSource(s)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 1024
        source.connect(analyser)
        const buf = new Uint8Array(analyser.fftSize)

        const tick = () => {
          if (cancelled || !audioCtx) return
          analyser.getByteTimeDomainData(buf)
          let sum = 0
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128
            sum += v * v
          }
          const rms = Math.sqrt(sum / buf.length)
          const now = performance.now()

          if (now - lastTriggerAt < COOLDOWN) { raf = requestAnimationFrame(tick); return }

          if (rms < FLOOR) armed = true
          if (armed && rms > THRESH) {
            armed = false
            const gap = now - lastClapAt
            if (lastClapAt && gap > MIN_GAP && gap < MAX_GAP) {
              lastTriggerAt = now
              lastClapAt = 0
              try { cbRef.current() } catch { /* ignore */ }
            } else {
              lastClapAt = now   // first clap of a potential pair
            }
          }
          // a lone first clap expires after MAX_GAP
          if (lastClapAt && now - lastClapAt > MAX_GAP) lastClapAt = 0

          raf = requestAnimationFrame(tick)
        }
        tick()
      })
      .catch(() => { /* no mic permission — silently disabled */ })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      if (stream) stream.getTracks().forEach((t) => t.stop())
      if (audioCtx) audioCtx.close().catch(() => {})
    }
  }, [enabled])
}
