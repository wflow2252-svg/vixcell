import { useEffect, useRef } from 'react'

/**
 * Always-on hands-free listening: continuously monitors the mic and fires
 * onWake the moment sustained speech begins — so the user just talks and the
 * assistant starts listening, no key/clap needed. Lightweight Web-Audio RMS;
 * the actual recording + VAD auto-stop is handled by useVoiceAssistant.
 *
 * Enable ONLY while idle (caller passes enabled = alwaysOn && state==='idle')
 * so it never fights the recorder or transcribes the assistant's own TTS.
 */
export function useWakeListener(enabled: boolean, onWake: () => void) {
  const cbRef = useRef(onWake)
  cbRef.current = onWake

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let audioCtx: AudioContext | null = null
    let stream: MediaStream | null = null
    let raf = 0

    let speechMs = 0          // accumulated time above threshold
    let lastT = 0
    let lastFireAt = 0

    const THRESH = 0.045      // RMS that counts as speech (ignores room hum)
    const NEED_MS = 350       // sustained speech needed to trigger (filters clicks/noise)
    const COOLDOWN = 2500     // ignore right after a trigger

    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      .then((s) => {
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return }
        stream = s
        audioCtx = new AudioContext()
        const src = audioCtx.createMediaStreamSource(s)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 1024
        src.connect(analyser)
        const buf = new Uint8Array(analyser.fftSize)
        lastT = performance.now()

        const tick = () => {
          if (cancelled || !audioCtx) return
          analyser.getByteTimeDomainData(buf)
          let sum = 0
          for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v }
          const rms = Math.sqrt(sum / buf.length)
          const now = performance.now()
          const dt = now - lastT
          lastT = now

          if (now - lastFireAt > COOLDOWN) {
            if (rms > THRESH) {
              speechMs += dt
              if (speechMs >= NEED_MS) {
                lastFireAt = now
                speechMs = 0
                try { cbRef.current() } catch { /* ignore */ }
              }
            } else {
              speechMs = Math.max(0, speechMs - dt) // decay so noise bursts don't accumulate
            }
          }
          raf = requestAnimationFrame(tick)
        }
        tick()
      })
      .catch(() => { /* no mic permission — silently off */ })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      if (stream) stream.getTracks().forEach((t) => t.stop())
      if (audioCtx) audioCtx.close().catch(() => {})
    }
  }, [enabled])
}
