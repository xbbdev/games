// High-performance procedural Web Audio Engine for GTA 3D
// Requires 0 external audio files - 100% resilient and zero-latency

class GameAudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private musicGain: GainNode | null = null

  // Engine Audio Nodes
  private engineOsc1: OscillatorNode | null = null
  private engineOsc2: OscillatorNode | null = null
  private engineSubOsc: OscillatorNode | null = null
  private engineFilter: BiquadFilterNode | null = null
  private engineGain: GainNode | null = null
  private engineRunning = false

  // Tire Screech
  private skidFilter: BiquadFilterNode | null = null
  private skidGain: GainNode | null = null
  private isSkidding = false

  // Siren
  private sirenOsc: OscillatorNode | null = null
  private sirenGain: GainNode | null = null
  private sirenLfo: OscillatorNode | null = null
  private isSirenPlaying = false

  // Radio Sequencer
  private radioInterval: number | null = null
  private currentStation = 1
  private radioStep = 0
  private radioBpm = 120

  // Ambient / Rain
  private rainGain: GainNode | null = null

  private initialized = false

  public init() {
    if (this.initialized) return
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AudioCtx()

      // Master Gain
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime)
      this.masterGain.connect(this.ctx.destination)

      // SFX Gain
      this.sfxGain = this.ctx.createGain()
      this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime)
      this.sfxGain.connect(this.masterGain)

      // Music Gain
      this.musicGain = this.ctx.createGain()
      this.musicGain.gain.setValueAtTime(0.65, this.ctx.currentTime)
      this.musicGain.connect(this.masterGain)

      this.setupEngineSynth()
      this.setupSkidSynth()
      this.setupRainSynth()

      this.initialized = true
    } catch (e) {
      console.warn('AudioContext failed to initialize:', e)
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  public setVolumes(sfxVol: number, musicVol: number) {
    if (!this.ctx || !this.sfxGain || !this.musicGain) return
    const now = this.ctx.currentTime
    this.sfxGain.gain.setTargetAtTime(Math.max(0, Math.min(1, sfxVol / 100)), now, 0.05)
    this.musicGain.gain.setTargetAtTime(Math.max(0, Math.min(1, musicVol / 100)), now, 0.05)
  }

  // --- ENGINE SYNTHESIS ---
  private setupEngineSynth() {
    if (!this.ctx || !this.sfxGain) return

    this.engineGain = this.ctx.createGain()
    this.engineGain.gain.setValueAtTime(0.0001, this.ctx.currentTime)

    this.engineFilter = this.ctx.createBiquadFilter()
    this.engineFilter.type = 'lowpass'
    this.engineFilter.frequency.setValueAtTime(350, this.ctx.currentTime)
    this.engineFilter.Q.setValueAtTime(3.5, this.ctx.currentTime)

    // Osc 1: Sawtooth for harsh cylinder firing
    this.engineOsc1 = this.ctx.createOscillator()
    this.engineOsc1.type = 'sawtooth'
    this.engineOsc1.frequency.setValueAtTime(45, this.ctx.currentTime)

    // Osc 2: Triangle for deep body resonance
    this.engineOsc2 = this.ctx.createOscillator()
    this.engineOsc2.type = 'triangle'
    this.engineOsc2.frequency.setValueAtTime(22.5, this.ctx.currentTime)

    // Osc 3: Sub pulse
    this.engineSubOsc = this.ctx.createOscillator()
    this.engineSubOsc.type = 'square'
    this.engineSubOsc.frequency.setValueAtTime(22.5, this.ctx.currentTime)

    const subGain = this.ctx.createGain()
    subGain.gain.setValueAtTime(0.35, this.ctx.currentTime)
    this.engineSubOsc.connect(subGain)
    subGain.connect(this.engineFilter)

    this.engineOsc1.connect(this.engineFilter)
    this.engineOsc2.connect(this.engineFilter)

    this.engineFilter.connect(this.engineGain)
    this.engineGain.connect(this.sfxGain)

    this.engineOsc1.start()
    this.engineOsc2.start()
    this.engineSubOsc.start()
  }

  public setEngineState(active: boolean, rpm: number = 0, speedKmh: number = 0) {
    if (!this.ctx || !this.engineGain || !this.engineFilter || !this.engineOsc1 || !this.engineOsc2) return
    this.resume()

    const now = this.ctx.currentTime
    if (!active) {
      if (this.engineRunning) {
        this.engineGain.gain.setTargetAtTime(0.0001, now, 0.2)
        this.engineRunning = false
      }
      return
    }

    if (!this.engineRunning) {
      this.playCarStart()
      this.engineRunning = true
    }

    // Dynamic pitch curve: idle ~45Hz, redline ~300Hz
    const baseFreq = 42 + rpm * 180 + (speedKmh / 200) * 80
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.08)
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.08)
    if (this.engineSubOsc) {
      this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 0.25, now, 0.08)
    }

    // Filter opens up as throttle increases
    const filterFreq = 300 + Math.pow(rpm, 1.8) * 3200
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.08)

    // Volume scales with throttle
    const targetVolume = 0.2 + rpm * 0.25
    this.engineGain.gain.setTargetAtTime(targetVolume, now, 0.05)
  }

  public playCarStart() {
    if (!this.ctx || !this.sfxGain) return
    this.resume()
    const now = this.ctx.currentTime

    // Ignition starter motor crank
    const crankOsc = this.ctx.createOscillator()
    const crankGain = this.ctx.createGain()
    crankOsc.type = 'sawtooth'
    crankOsc.frequency.setValueAtTime(25, now)
    crankOsc.frequency.linearRampToValueAtTime(55, now + 0.35)

    crankGain.gain.setValueAtTime(0.3, now)
    crankGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

    crankOsc.connect(crankGain)
    crankGain.connect(this.sfxGain)

    crankOsc.start(now)
    crankOsc.stop(now + 0.4)
  }

  // --- TIRE SKID SYNTHESIS ---
  private setupSkidSynth() {
    if (!this.ctx || !this.sfxGain) return

    // Noise buffer
    const bufferSize = this.ctx.sampleRate * 2
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }

    const whiteNoise = this.ctx.createBufferSource()
    whiteNoise.buffer = noiseBuffer
    whiteNoise.loop = true

    this.skidFilter = this.ctx.createBiquadFilter()
    this.skidFilter.type = 'bandpass'
    this.skidFilter.frequency.setValueAtTime(950, this.ctx.currentTime)
    this.skidFilter.Q.setValueAtTime(4.0, this.ctx.currentTime)

    this.skidGain = this.ctx.createGain()
    this.skidGain.gain.setValueAtTime(0.0001, this.ctx.currentTime)

    whiteNoise.connect(this.skidFilter)
    this.skidFilter.connect(this.skidGain)
    this.skidGain.connect(this.sfxGain)

    whiteNoise.start()
  }

  public setSkid(active: boolean, intensity: number = 0.5) {
    if (!this.ctx || !this.skidGain) return
    const now = this.ctx.currentTime
    if (active) {
      this.skidGain.gain.setTargetAtTime(Math.min(0.4, intensity * 0.4), now, 0.05)
      this.isSkidding = true
    } else if (this.isSkidding) {
      this.skidGain.gain.setTargetAtTime(0.0001, now, 0.1)
      this.isSkidding = false
    }
  }

  // --- POLICE SIREN ---
  public setSiren(active: boolean) {
    if (!this.ctx || !this.sfxGain) return
    this.resume()

    if (active && !this.isSirenPlaying) {
      this.isSirenPlaying = true
      const now = this.ctx.currentTime

      this.sirenOsc = this.ctx.createOscillator()
      this.sirenOsc.type = 'sawtooth'
      this.sirenOsc.frequency.setValueAtTime(850, now)

      this.sirenLfo = this.ctx.createOscillator()
      this.sirenLfo.frequency.setValueAtTime(0.65, now) // slow wail

      const lfoGain = this.ctx.createGain()
      lfoGain.gain.setValueAtTime(400, now) // sweeps between 650Hz and 1250Hz

      this.sirenLfo.connect(lfoGain)
      lfoGain.connect(this.sirenOsc.frequency)

      this.sirenGain = this.ctx.createGain()
      this.sirenGain.gain.setValueAtTime(0.001, now)
      this.sirenGain.gain.exponentialRampToValueAtTime(0.28, now + 0.2)

      this.sirenOsc.connect(this.sirenGain)
      this.sirenGain.connect(this.sfxGain)

      this.sirenLfo.start(now)
      this.sirenOsc.start(now)
    } else if (!active && this.isSirenPlaying) {
      this.isSirenPlaying = false
      if (this.sirenGain && this.ctx) {
        const now = this.ctx.currentTime
        this.sirenGain.gain.setTargetAtTime(0.0001, now, 0.1)
        setTimeout(() => {
          if (!this.isSirenPlaying) {
            this.sirenOsc?.stop()
            this.sirenLfo?.stop()
            this.sirenOsc?.disconnect()
            this.sirenLfo?.disconnect()
            this.sirenOsc = null
            this.sirenLfo = null
          }
        }, 150)
      }
    }
  }

  // --- CAR HORN ---
  public playHorn() {
    if (!this.ctx || !this.sfxGain) return
    this.resume()
    const now = this.ctx.currentTime

    const osc1 = this.ctx.createOscillator()
    const osc2 = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc1.type = 'sawtooth'
    osc2.type = 'sawtooth'
    osc1.frequency.setValueAtTime(435, now) // F# / A dual horn
    osc2.frequency.setValueAtTime(540, now)

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(700, now)
    filter.Q.setValueAtTime(1.5, now)

    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

    osc1.connect(filter)
    osc2.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxGain)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 0.5)
    osc2.stop(now + 0.5)
  }

  // --- COLLISION CRASH ---
  public playCrash(impactIntensity: number = 1.0) {
    if (!this.ctx || !this.sfxGain) return
    this.resume()
    const now = this.ctx.currentTime

    // Heavy low punch
    const punchOsc = this.ctx.createOscillator()
    const punchGain = this.ctx.createGain()
    punchOsc.type = 'sine'
    punchOsc.frequency.setValueAtTime(160, now)
    punchOsc.frequency.exponentialRampToValueAtTime(30, now + 0.3)

    punchGain.gain.setValueAtTime(Math.min(0.7, 0.4 * impactIntensity), now)
    punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

    punchOsc.connect(punchGain)
    punchGain.connect(this.sfxGain)
    punchOsc.start(now)
    punchOsc.stop(now + 0.35)

    // Metal crunch noise
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.4)
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25))
    }

    const noiseSource = this.ctx.createBufferSource()
    noiseSource.buffer = noiseBuffer

    const crunchFilter = this.ctx.createBiquadFilter()
    crunchFilter.type = 'lowpass'
    crunchFilter.frequency.setValueAtTime(1800, now)

    const crunchGain = this.ctx.createGain()
    crunchGain.gain.setValueAtTime(Math.min(0.5, 0.35 * impactIntensity), now)
    crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

    noiseSource.connect(crunchFilter)
    crunchFilter.connect(crunchGain)
    crunchGain.connect(this.sfxGain)

    noiseSource.start(now)
  }

  // --- FOOTSTEP ---
  public playFootstep(isRunning: boolean = false) {
    if (!this.ctx || !this.sfxGain) return
    this.resume()
    const now = this.ctx.currentTime

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(isRunning ? 110 : 85, now)
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.08)

    gain.gain.setValueAtTime(isRunning ? 0.2 : 0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

    osc.connect(gain)
    gain.connect(this.sfxGain)

    osc.start(now)
    osc.stop(now + 0.08)
  }

  // --- CAR DOOR SLAM / ENTER ---
  public playDoorSlam() {
    if (!this.ctx || !this.sfxGain) return
    this.resume()
    const now = this.ctx.currentTime

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(140, now)
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15)

    gain.gain.setValueAtTime(0.35, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(now)
    osc.stop(now + 0.15)
  }

  // --- MISSION PASSED / FANFARE ---
  public playMissionSuccess() {
    if (!this.ctx || !this.sfxGain) return
    this.resume()
    const now = this.ctx.currentTime

    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99] // C4, E4, G4, C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator()
      const gain = this.ctx!.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + idx * 0.09)

      gain.gain.setValueAtTime(0, now)
      gain.gain.setValueAtTime(0.3, now + idx * 0.09)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.45)

      osc.connect(gain)
      gain.connect(this.sfxGain!)

      osc.start(now + idx * 0.09)
      osc.stop(now + idx * 0.09 + 0.5)
    })
  }

  // --- POLICE DISPATCH CHIRP ---
  public playWantedChirp() {
    if (!this.ctx || !this.sfxGain) return
    this.resume()
    const now = this.ctx.currentTime

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(980, now)
    osc.frequency.exponentialRampToValueAtTime(1300, now + 0.08)
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.16)

    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(now)
    osc.stop(now + 0.18)
  }

  // --- RAIN SYNTHESIS ---
  private setupRainSynth() {
    if (!this.ctx || !this.sfxGain) return

    const bufferSize = this.ctx.sampleRate * 2
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const rainSource = this.ctx.createBufferSource()
    rainSource.buffer = buffer
    rainSource.loop = true

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime)

    this.rainGain = this.ctx.createGain()
    this.rainGain.gain.setValueAtTime(0.0001, this.ctx.currentTime)

    rainSource.connect(filter)
    filter.connect(this.rainGain)
    this.rainGain.connect(this.sfxGain)

    rainSource.start()
  }

  public setRain(isRaining: boolean) {
    if (!this.ctx || !this.rainGain) return
    const now = this.ctx.currentTime
    this.rainGain.gain.setTargetAtTime(isRaining ? 0.22 : 0.0001, now, 1.0)
  }

  // --- IN-GAME RADIO STATIONS (SYNTHWAVE, HIP-HOP, ELECTRO) ---
  public setRadioStation(stationIndex: number) {
    this.currentStation = stationIndex
    if (this.radioInterval) {
      clearInterval(this.radioInterval)
      this.radioInterval = null
    }

    if (stationIndex === 0 || !this.ctx || !this.musicGain) {
      return
    }

    this.resume()
    this.radioStep = 0

    if (stationIndex === 1) {
      // Flash FM Synthwave (116 BPM)
      this.radioBpm = 116
    } else if (stationIndex === 2) {
      // West Coast Hip Hop (88 BPM)
      this.radioBpm = 88
    } else {
      // Electro Shock (126 BPM)
      this.radioBpm = 126
    }

    const stepDurationMs = (60 / this.radioBpm / 4) * 1000 // 16th notes
    this.radioInterval = window.setInterval(() => {
      this.playRadioStep()
    }, stepDurationMs)
  }

  private playRadioStep() {
    if (!this.ctx || !this.musicGain) return
    const now = this.ctx.currentTime
    const step = this.radioStep % 16

    if (this.currentStation === 1) {
      // SYNTHWAVE: Arp bass & pads & drums
      // Kick on 0, 4, 8, 12
      if (step % 4 === 0) {
        this.synthKick(now, 0.4)
      }
      // Snare on 4, 12
      if (step === 4 || step === 12) {
        this.synthSnare(now, 0.3)
      }
      // Hi-hat on every odd 16th
      if (step % 2 === 1) {
        this.synthHihat(now, 0.12)
      }
      // Bassline note (A minor - F - C - G sequence)
      const bar = Math.floor(this.radioStep / 16) % 4
      const roots = [110, 87.31, 130.81, 98.0] // A2, F2, C3, G2
      const root = roots[bar]
      const bassFreq = step % 2 === 0 ? root : root * 1.5
      this.synthBassNote(now, bassFreq, 0.18)

    } else if (this.currentStation === 2) {
      // HIP HOP: Deep 808 kick, tight snare, funky chords
      if (step === 0 || step === 6 || step === 10) {
        this.synth808Kick(now, 0.5)
      }
      if (step === 4 || step === 12) {
        this.synthSnare(now, 0.35)
      }
      if (step % 2 === 0 || step === 7 || step === 15) {
        this.synthHihat(now, 0.15)
      }
      // Rhodes chord on beat 0 and 8
      if (step === 0 || step === 8) {
        this.synthRhodesChord(now)
      }

    } else if (this.currentStation === 3) {
      // ELECTRO SHOCK: Driving 4-on-the-floor, acid bassline
      if (step % 4 === 0) {
        this.synthKick(now, 0.55)
      }
      if (step % 4 === 2) {
        this.synthOpenHat(now, 0.22)
      }
      if (step === 4 || step === 12) {
        this.synthClap(now, 0.3)
      }
      // 16th acid rolling bass
      const acidNotes = [65.41, 65.41, 77.78, 65.41, 87.31, 65.41, 98.0, 77.78]
      const noteFreq = acidNotes[step % 8]
      this.synthAcidNote(now, noteFreq, 0.2)
    }

    this.radioStep++
  }

  // --- SYNTH INSTRUMENT HELPERS ---
  private synthKick(time: number, vol: number) {
    if (!this.ctx || !this.musicGain) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.frequency.setValueAtTime(140, time)
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12)
    gain.gain.setValueAtTime(vol, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16)
    osc.connect(gain)
    gain.connect(this.musicGain)
    osc.start(time)
    osc.stop(time + 0.16)
  }

  private synth808Kick(time: number, vol: number) {
    if (!this.ctx || !this.musicGain) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.frequency.setValueAtTime(95, time)
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.35)
    gain.gain.setValueAtTime(vol, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45)
    osc.connect(gain)
    gain.connect(this.musicGain)
    osc.start(time)
    osc.stop(time + 0.45)
  }

  private synthSnare(time: number, vol: number) {
    if (!this.ctx || !this.musicGain) return
    const osc = this.ctx.createOscillator()
    const oscGain = this.ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(180, time)
    osc.frequency.exponentialRampToValueAtTime(60, time + 0.1)
    oscGain.gain.setValueAtTime(vol * 0.7, time)
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1)
    osc.connect(oscGain)
    oscGain.connect(this.musicGain)
    osc.start(time)
    osc.stop(time + 0.1)
  }

  private synthClap(time: number, vol: number) {
    if (!this.ctx || !this.musicGain) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(320, time)
    gain.gain.setValueAtTime(vol * 0.5, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12)
    osc.connect(gain)
    gain.connect(this.musicGain)
    osc.start(time)
    osc.stop(time + 0.12)
  }

  private synthHihat(time: number, vol: number) {
    if (!this.ctx || !this.musicGain) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'highpass' as unknown as OscillatorType // use high freq triangle
    osc.type = 'square'
    osc.frequency.setValueAtTime(7500, time)
    gain.gain.setValueAtTime(vol * 0.3, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04)
    osc.connect(gain)
    gain.connect(this.musicGain)
    osc.start(time)
    osc.stop(time + 0.04)
  }

  private synthOpenHat(time: number, vol: number) {
    if (!this.ctx || !this.musicGain) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(6200, time)
    gain.gain.setValueAtTime(vol * 0.35, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18)
    osc.connect(gain)
    gain.connect(this.musicGain)
    osc.start(time)
    osc.stop(time + 0.18)
  }

  private synthBassNote(time: number, freq: number, vol: number) {
    if (!this.ctx || !this.musicGain) return
    const osc = this.ctx.createOscillator()
    const filter = this.ctx.createBiquadFilter()
    const gain = this.ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(freq, time)

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(800, time)
    filter.frequency.exponentialRampToValueAtTime(250, time + 0.15)

    gain.gain.setValueAtTime(vol, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.musicGain)

    osc.start(time)
    osc.stop(time + 0.16)
  }

  private synthAcidNote(time: number, freq: number, vol: number) {
    if (!this.ctx || !this.musicGain) return
    const osc = this.ctx.createOscillator()
    const filter = this.ctx.createBiquadFilter()
    const gain = this.ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(freq, time)

    filter.type = 'lowpass'
    filter.Q.setValueAtTime(10, time) // Acid resonance!
    filter.frequency.setValueAtTime(1900, time)
    filter.frequency.exponentialRampToValueAtTime(320, time + 0.11)

    gain.gain.setValueAtTime(vol, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.musicGain)

    osc.start(time)
    osc.stop(time + 0.12)
  }

  private synthRhodesChord(time: number) {
    if (!this.ctx || !this.musicGain) return
    const chordNotes = [220, 261.63, 329.63, 392.0] // Am7
    chordNotes.forEach((freq) => {
      const osc = this.ctx!.createOscillator()
      const gain = this.ctx!.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, time)

      gain.gain.setValueAtTime(0.08, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8)

      osc.connect(gain)
      gain.connect(this.musicGain!)

      osc.start(time)
      osc.stop(time + 0.8)
    })
  }

  public cleanup() {
    if (this.radioInterval) {
      clearInterval(this.radioInterval)
      this.radioInterval = null
    }
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }
  }
}

export const gameAudio = new GameAudioEngine()
