const SCRATCH_SAMPLE_URL = '/sounds/starter-weekly-drop-scratch.mp3'

/** @type {Promise<ArrayBuffer> | null} */
let scratchArrayBufferPromise = null

function fetchScratchArrayBuffer() {
  if (!scratchArrayBufferPromise) {
    scratchArrayBufferPromise = fetch(SCRATCH_SAMPLE_URL)
      .then((response) => {
        if (!response.ok) throw new Error('scratch sample missing')
        return response.arrayBuffer()
      })
      .catch((err) => {
        scratchArrayBufferPromise = null
        throw err
      })
  }
  return scratchArrayBufferPromise
}

/**
 * Real scratch-off rub loop while dragging — starts only after confirmed pointer movement.
 * Sample extracted from Ryan's IMG_3578.mov recording.
 */
export class ScratchRevealAudio {
  constructor() {
    /** @type {AudioContext | null} */
    this.ctx = null
    /** @type {AudioBuffer | null} */
    this.buffer = null
    /** @type {AudioBufferSourceNode | null} */
    this.source = null
    /** @type {GainNode | null} */
    this.gain = null
    this.playing = false
    this.pendingStart = false
    /** @type {Promise<void> | null} */
    this.loadPromise = null
  }

  ensureContext() {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return null
      this.ctx = new Ctx()
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    return this.ctx
  }

  preload() {
    void this.ensureSampleLoaded()
  }

  ensureSampleLoaded() {
    if (this.buffer) return Promise.resolve()
    if (this.loadPromise) return this.loadPromise

    const ctx = this.ensureContext()
    if (!ctx) return Promise.resolve()

    this.loadPromise = fetchScratchArrayBuffer()
      .then((arrayBuffer) => ctx.decodeAudioData(arrayBuffer.slice(0)))
      .then((decoded) => {
        this.buffer = decoded
        if (this.pendingStart) {
          this.pendingStart = false
          this.startPlayback()
        }
      })
      .catch(() => {
        this.pendingStart = false
      })
      .finally(() => {
        this.loadPromise = null
      })

    return this.loadPromise
  }

  startPlayback() {
    const ctx = this.ctx
    const buffer = this.buffer
    if (!ctx || !buffer || this.playing) return

    this.source = ctx.createBufferSource()
    this.source.buffer = buffer
    this.source.loop = true

    this.gain = ctx.createGain()
    this.gain.gain.value = 0.72

    this.source.connect(this.gain)
    this.gain.connect(ctx.destination)
    this.source.start(0)
    this.playing = true
  }

  start() {
    if (this.playing) return
    const ctx = this.ensureContext()
    if (!ctx) return

    if (this.buffer) {
      this.startPlayback()
      return
    }

    this.pendingStart = true
    void this.ensureSampleLoaded()
  }

  stop() {
    if (!this.playing) {
      this.pendingStart = false
      return
    }
    try {
      this.source?.stop()
    } catch {
      // ignore
    }
    this.source?.disconnect()
    this.gain?.disconnect()
    this.source = null
    this.gain = null
    this.playing = false
    this.pendingStart = false
  }

  dispose() {
    this.stop()
    void this.ctx?.close()
    this.ctx = null
    this.buffer = null
  }
}
