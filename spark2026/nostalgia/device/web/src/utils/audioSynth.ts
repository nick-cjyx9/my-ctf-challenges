// Web Audio Synthesizer fallback for retro music demo when external audio can't load or is blocked
class RetroSynth {
  private ctx: AudioContext | null = null
  private timer: number | null = null
  private step = 0

  // Melodic notes for "Never Gonna Give You Up" intro:
  // F4, G4, Bb4, G4, D5, D5, C5, F4, G4, Bb4, G4, C5, C5, Bb4, A4, G4...
  private melody = [
    { note: 349.23, dur: 0.18 }, // F4
    { note: 392.00, dur: 0.18 }, // G4
    { note: 466.16, dur: 0.25 }, // Bb4
    { note: 392.00, dur: 0.25 }, // G4
    { note: 587.33, dur: 0.4 },  // D5
    { note: 587.33, dur: 0.3 },  // D5
    { note: 523.25, dur: 0.6 },  // C5
    { note: 0, dur: 0.2 },       // Rest
    { note: 349.23, dur: 0.18 }, // F4
    { note: 392.00, dur: 0.18 }, // G4
    { note: 466.16, dur: 0.25 }, // Bb4
    { note: 392.00, dur: 0.25 }, // G4
    { note: 523.25, dur: 0.4 },  // C5
    { note: 523.25, dur: 0.3 },  // C5
    { note: 466.16, dur: 0.4 },  // Bb4
    { note: 440.00, dur: 0.25 }, // A4
    { note: 392.00, dur: 0.6 },  // G4
    { note: 0, dur: 0.3 }        // Rest
  ]

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  playBeep(freq = 800, dur = 0.05, type: OscillatorType = 'sine') {
    try {
      this.init()
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime)
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + dur)
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  startMelody() {
    this.stopMelody()
    this.init()
    this.step = 0
    this.scheduleNext()
  }

  private scheduleNext() {
    if (this.step >= this.melody.length) {
      this.step = 0
    }
    const current = this.melody[this.step]
    if (current.note > 0 && this.ctx) {
      try {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(current.note, this.ctx.currentTime)
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + current.dur * 0.9)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start()
        osc.stop(this.ctx.currentTime + current.dur)
      } catch {
        // audio play error ignore
      }
    }
    this.step++
    this.timer = window.setTimeout(() => {
      this.scheduleNext()
    }, current.dur * 1000)
  }

  stopMelody() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
}

export const synth = new RetroSynth()
