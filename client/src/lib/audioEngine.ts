/**
 * audioEngine.ts — Web Audio API движок для двойной деки.
 *
 * Граф аудио:
 *
 *  DeckA: source → EQ (bass/mid/treble) → gainA ─┐
 *                                                   ├─► masterGain → destination
 *  DeckB: source → EQ (bass/mid/treble) → gainB ─┘
 *
 * Кроссфейдер управляет gainA и gainB одновременно.
 * Значение 0 = только дека A, 1 = только дека B, 0.5 = оба 50/50.
 */

const _API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:8000";
const _NGROK_HEADERS: HeadersInit = _API_BASE.includes("ngrok")
  ? { "ngrok-skip-browser-warning": "true" }
  : {};

function _apiFetch(url: string): Promise<Response> {
  return fetch(url, { headers: _NGROK_HEADERS });
}

export interface DeckState {
  trackId: string | null;
  trackTitle: string;
  trackArtist: string;
  coverUri: string | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  isLoading: boolean;
  bpm: number | null;
  waveformData: Float32Array | null;
  /** 0–1 */
  bass: number;
  mid: number;
  treble: number;
  volume: number;
  /** Cue point in seconds */
  cuePoint: number | null;
  /** Loop: null = off, [start, end] in seconds */
  loop: [number, number] | null;
  loopActive: boolean;
  /** Pitch shift ratio (1.0 = normal) */
  pitch: number;
}

export interface EngineState {
  deckA: DeckState;
  deckB: DeckState;
  /** 0 = full A, 1 = full B */
  crossfader: number;
  masterVolume: number;
  isRecording: boolean;
}

const DEFAULT_DECK: DeckState = {
  trackId: null,
  trackTitle: "Нет трека",
  trackArtist: "",
  coverUri: null,
  duration: 0,
  currentTime: 0,
  isPlaying: false,
  isLoading: false,
  bpm: null,
  waveformData: null,
  bass: 0.5,
  mid: 0.5,
  treble: 0.5,
  volume: 1,
  cuePoint: null,
  loop: null,
  loopActive: false,
  pitch: 1.0,
};

type StateListener = (state: EngineState) => void;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain!: GainNode;

  // Deck A nodes
  private sourceA: AudioBufferSourceNode | null = null;
  private bufferA: AudioBuffer | null = null;
  private gainA!: GainNode;
  private bassA!: BiquadFilterNode;
  private midA!: BiquadFilterNode;
  private trebleA!: BiquadFilterNode;
  private analyserA!: AnalyserNode;
  private startTimeA = 0;
  private offsetA = 0;

  // Deck B nodes
  private sourceB: AudioBufferSourceNode | null = null;
  private bufferB: AudioBuffer | null = null;
  private gainB!: GainNode;
  private bassB!: BiquadFilterNode;
  private midB!: BiquadFilterNode;
  private trebleB!: BiquadFilterNode;
  private analyserB!: AnalyserNode;
  private startTimeB = 0;
  private offsetB = 0;

  private state: EngineState = {
    deckA: { ...DEFAULT_DECK },
    deckB: { ...DEFAULT_DECK },
    crossfader: 0,
    masterVolume: 0.85,
    isRecording: false,
  };

  private listeners: StateListener[] = [];
  private rafId: number | null = null;

  // ─── Initialise ───────────────────────────────────────────────────────────

  private ensureContext() {
    if (this.ctx) return;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.state.masterVolume;
    this.masterGain.connect(this.ctx.destination);

    // Deck A
    this.gainA = this.ctx.createGain();
    this.gainA.gain.value = 1;
    this.bassA = this.createEQBand("lowshelf", 80);
    this.midA = this.createEQBand("peaking", 1000);
    this.trebleA = this.createEQBand("highshelf", 8000);
    this.analyserA = this.ctx.createAnalyser();
    this.analyserA.fftSize = 2048;
    this.bassA.connect(this.midA);
    this.midA.connect(this.trebleA);
    this.trebleA.connect(this.analyserA);
    this.analyserA.connect(this.gainA);
    this.gainA.connect(this.masterGain);

    // Deck B
    this.gainB = this.ctx.createGain();
    this.gainB.gain.value = 0;
    this.bassB = this.createEQBand("lowshelf", 80);
    this.midB = this.createEQBand("peaking", 1000);
    this.trebleB = this.createEQBand("highshelf", 8000);
    this.analyserB = this.ctx.createAnalyser();
    this.analyserB.fftSize = 2048;
    this.bassB.connect(this.midB);
    this.midB.connect(this.trebleB);
    this.trebleB.connect(this.analyserB);
    this.analyserB.connect(this.gainB);
    this.gainB.connect(this.masterGain);

    this.startRaf();
  }

  private createEQBand(type: BiquadFilterType, frequency: number): BiquadFilterNode {
    const f = this.ctx!.createBiquadFilter();
    f.type = type;
    f.frequency.value = frequency;
    f.gain.value = 0;
    return f;
  }

  // ─── Load track ───────────────────────────────────────────────────────────

  async loadTrack(deck: "A" | "B", url: string, meta: {
    trackId: string;
    title: string;
    artist: string;
    coverUri: string | null;
  }) {
    this.ensureContext();
    const deckKey = deck === "A" ? "deckA" : "deckB";
    this.updateDeck(deck, { isLoading: true, trackId: meta.trackId, trackTitle: meta.title, trackArtist: meta.artist, coverUri: meta.coverUri });

    try {
      const response = await _apiFetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);

      if (deck === "A") {
        this.bufferA = audioBuffer;
        if (this.sourceA) { try { this.sourceA.stop(); } catch {} }
        this.sourceA = null;
        this.offsetA = 0;
      } else {
        this.bufferB = audioBuffer;
        if (this.sourceB) { try { this.sourceB.stop(); } catch {} }
        this.sourceB = null;
        this.offsetB = 0;
      }

      // Generate waveform data
      const waveformData = this.generateWaveform(audioBuffer);
      const bpm = await this.detectBPM(audioBuffer);

      this.updateDeck(deck, {
        isLoading: false,
        duration: audioBuffer.duration,
        currentTime: 0,
        isPlaying: false,
        waveformData,
        bpm,
      });

      // Save BPM to backend metadata for future recommendations
      if (bpm && meta.trackId) {
        fetch(`${_API_BASE}/api/tracks/${meta.trackId}/bpm?bpm=${bpm}`, {
          method: "PATCH",
          headers: { ..._NGROK_HEADERS },
        }).catch(() => {}); // fire-and-forget, ignore errors
      }
    } catch (e) {
      console.error("Failed to load track:", e);
      this.updateDeck(deck, { isLoading: false });
    }
  }

  // ─── Playback ─────────────────────────────────────────────────────────────

  play(deck: "A" | "B") {
    this.ensureContext();
    if (this.ctx!.state === "suspended") this.ctx!.resume();

    const buffer = deck === "A" ? this.bufferA : this.bufferB;
    if (!buffer) return;

    const offset = deck === "A" ? this.offsetA : this.offsetB;
    const source = this.ctx!.createBufferSource();
    source.buffer = buffer;

    const firstNode = deck === "A" ? this.bassA : this.bassB;
    source.connect(firstNode);

    source.onended = () => {
      if (deck === "A") { this.offsetA = 0; }
      else { this.offsetB = 0; }
      this.updateDeck(deck, { isPlaying: false, currentTime: 0 });
    };

    source.start(0, offset);

    if (deck === "A") {
      this.sourceA = source;
      this.startTimeA = this.ctx!.currentTime - offset;
    } else {
      this.sourceB = source;
      this.startTimeB = this.ctx!.currentTime - offset;
    }

    this.updateDeck(deck, { isPlaying: true });
  }

  pause(deck: "A" | "B") {
    const source = deck === "A" ? this.sourceA : this.sourceB;
    if (!source) return;

    const elapsed = this.ctx!.currentTime - (deck === "A" ? this.startTimeA : this.startTimeB);
    if (deck === "A") {
      this.offsetA = Math.min(elapsed, (this.bufferA?.duration ?? 0));
      try { this.sourceA?.stop(); } catch {}
      this.sourceA = null;
    } else {
      this.offsetB = Math.min(elapsed, (this.bufferB?.duration ?? 0));
      try { this.sourceB?.stop(); } catch {}
      this.sourceB = null;
    }
    this.updateDeck(deck, { isPlaying: false });
  }

  seek(deck: "A" | "B", time: number) {
    const wasPlaying = deck === "A" ? this.state.deckA.isPlaying : this.state.deckB.isPlaying;
    if (wasPlaying) this.pause(deck);
    if (deck === "A") this.offsetA = time;
    else this.offsetB = time;
    this.updateDeck(deck, { currentTime: time });
    if (wasPlaying) this.play(deck);
  }

  // ─── Crossfader ───────────────────────────────────────────────────────────

  setCrossfader(value: number) {
    // value: 0 = full A, 1 = full B
    const v = Math.max(0, Math.min(1, value));
    // Equal-power crossfade curve
    const gainA = Math.cos(v * Math.PI * 0.5);
    const gainB = Math.cos((1 - v) * Math.PI * 0.5);
    if (this.gainA) this.gainA.gain.setTargetAtTime(gainA, this.ctx!.currentTime, 0.01);
    if (this.gainB) this.gainB.gain.setTargetAtTime(gainB, this.ctx!.currentTime, 0.01);
    this.state = { ...this.state, crossfader: v };
    this.notify();
  }

  // ─── EQ ───────────────────────────────────────────────────────────────────

  setEQ(deck: "A" | "B", band: "bass" | "mid" | "treble", value: number) {
    // value: 0–1, mapped to -12dB to +12dB
    const db = (value - 0.5) * 24;
    const node = deck === "A"
      ? (band === "bass" ? this.bassA : band === "mid" ? this.midA : this.trebleA)
      : (band === "bass" ? this.bassB : band === "mid" ? this.midB : this.trebleB);
    if (node) node.gain.setTargetAtTime(db, this.ctx!.currentTime, 0.02);
    this.updateDeck(deck, { [band]: value } as Partial<DeckState>);
  }

  // ─── Master volume ────────────────────────────────────────────────────────

  setMasterVolume(value: number) {
    if (this.masterGain) this.masterGain.gain.setTargetAtTime(value, this.ctx!.currentTime, 0.02);
    this.state = { ...this.state, masterVolume: value };
    this.notify();
  }

  // ─── Cue points ───────────────────────────────────────────────────────────

  setCue(deck: "A" | "B") {
    const d = deck === "A" ? this.state.deckA : this.state.deckB;
    const t = d.currentTime;
    this.updateDeck(deck, { cuePoint: t });
  }

  jumpToCue(deck: "A" | "B") {
    const d = deck === "A" ? this.state.deckA : this.state.deckB;
    if (d.cuePoint !== null) this.seek(deck, d.cuePoint);
  }

  // ─── Loop ─────────────────────────────────────────────────────────────────

  setLoop(deck: "A" | "B", bars: number = 4) {
    const d = deck === "A" ? this.state.deckA : this.state.deckB;
    if (!d.bpm) return;
    const barDuration = (60 / d.bpm) * 4; // 4 beats per bar
    const start = d.currentTime;
    const end = Math.min(start + barDuration * bars, d.duration);
    this.updateDeck(deck, { loop: [start, end], loopActive: true });
    // Restart playback from loop start
    this.seek(deck, start);
    if (!d.isPlaying) this.play(deck);
  }

  toggleLoop(deck: "A" | "B") {
    const d = deck === "A" ? this.state.deckA : this.state.deckB;
    if (!d.loop) {
      this.setLoop(deck, 4);
    } else {
      this.updateDeck(deck, { loopActive: !d.loopActive });
    }
  }

  clearLoop(deck: "A" | "B") {
    this.updateDeck(deck, { loop: null, loopActive: false });
  }

  // ─── Pitch control ────────────────────────────────────────────────────────

  updateDeckBPM(deck: "A" | "B", bpm: number) {
    this.updateDeck(deck, { bpm });
  }

  setPitch(deck: "A" | "B", ratio: number) {
    const clamped = Math.max(0.5, Math.min(2.0, ratio));
    const source = deck === "A" ? this.sourceA : this.sourceB;
    if (source) source.playbackRate.setTargetAtTime(clamped, this.ctx!.currentTime, 0.05);
    this.updateDeck(deck, { pitch: clamped });
  }

  // ─── BPM sync ─────────────────────────────────────────────────────────────

  syncBPM(sourceDeck: "A" | "B") {
    const src = sourceDeck === "A" ? this.state.deckA : this.state.deckB;
    const dst = sourceDeck === "A" ? this.state.deckB : this.state.deckA;
    if (!src.bpm || !dst.bpm) return;
    const ratio = src.bpm / dst.bpm;
    const targetSource = sourceDeck === "A" ? this.sourceB : this.sourceA;
    if (targetSource) targetSource.playbackRate.setTargetAtTime(ratio, this.ctx!.currentTime, 0.1);
  }

  // ─── Waveform & BPM analysis ──────────────────────────────────────────────

  private generateWaveform(buffer: AudioBuffer, samples = 200): Float32Array {
    const data = buffer.getChannelData(0);
    const blockSize = Math.floor(data.length / samples);
    const waveform = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(data[i * blockSize + j]);
      }
      waveform[i] = sum / blockSize;
    }
    // Normalise
    const max = Math.max(...Array.from(waveform));
    if (max > 0) for (let i = 0; i < waveform.length; i++) waveform[i] /= max;
    return waveform;
  }

  async detectBPM(buffer: AudioBuffer): Promise<number | null> {
    try {
      // Autocorrelation-based BPM detection on mono channel
      const data = buffer.getChannelData(0);
      const sampleRate = buffer.sampleRate;
      // Analyse first 30 seconds
      const analyseLength = Math.min(data.length, sampleRate * 30);
      const chunk = data.slice(0, analyseLength);

      // Downsample to ~4400 Hz for speed
      const downsampleFactor = Math.floor(sampleRate / 4400);
      const downsampled: number[] = [];
      for (let i = 0; i < chunk.length; i += downsampleFactor) {
        downsampled.push(Math.abs(chunk[i]));
      }

      // Autocorrelation
      const minBPM = 60, maxBPM = 180;
      const dsRate = sampleRate / downsampleFactor;
      const minLag = Math.floor(dsRate * 60 / maxBPM);
      const maxLag = Math.floor(dsRate * 60 / minBPM);

      let bestCorr = -Infinity;
      let bestLag = minLag;

      for (let lag = minLag; lag <= maxLag; lag++) {
        let corr = 0;
        const len = downsampled.length - lag;
        for (let i = 0; i < len; i++) {
          corr += downsampled[i] * downsampled[i + lag];
        }
        corr /= len;
        if (corr > bestCorr) {
          bestCorr = corr;
          bestLag = lag;
        }
      }

      const bpm = Math.round((dsRate * 60) / bestLag);
      // Sanity check
      if (bpm < 60 || bpm > 200) return null;
      return bpm;
    } catch {
      return null;
    }
  }

  // ─── Realtime waveform for visualiser ─────────────────────────────────────

  getRealtimeFrequency(deck: "A" | "B"): Uint8Array {
    const analyser = deck === "A" ? this.analyserA : this.analyserB;
    if (!analyser) return new Uint8Array(0);
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    return data;
  }

  getRealtimeWaveform(deck: "A" | "B"): Uint8Array {
    const analyser = deck === "A" ? this.analyserA : this.analyserB;
    if (!analyser) return new Uint8Array(0);
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(data);
    return data;
  }

  getFrequencyData(deck: "A" | "B"): Uint8Array {
    const analyser = deck === "A" ? this.analyserA : this.analyserB;
    if (!analyser) return new Uint8Array(0);
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    return data;
  }

  // ─── AI transition hint ───────────────────────────────────────────────────

  /**
   * Returns a hint about the best moment to start crossfading.
   * "now" = good time, "wait" = not yet, "urgent" = track ending soon
   */
  getTransitionHint(deck: "A" | "B"): "now" | "wait" | "urgent" | null {
    const d = deck === "A" ? this.state.deckA : this.state.deckB;
    if (!d.isPlaying || d.duration === 0) return null;
    const remaining = d.duration - d.currentTime;
    const progress = d.currentTime / d.duration;

    if (remaining < 15) return "urgent";
    if (progress > 0.65 && progress < 0.85) return "now";
    return "wait";
  }

  /**
   * Returns compatibility score 0–100 between two tracks based on BPM.
   */
  getCompatibilityScore(): number {
    const bpmA = this.state.deckA.bpm;
    const bpmB = this.state.deckB.bpm;
    if (!bpmA || !bpmB) return 50;
    const diff = Math.abs(bpmA - bpmB);
    if (diff === 0) return 100;
    if (diff <= 3) return 95;
    if (diff <= 8) return 80;
    if (diff <= 15) return 60;
    if (diff <= 25) return 35;
    return 15;
  }

  // ─── RAF loop ─────────────────────────────────────────────────────────────

  private startRaf() {
    const loop = () => {
      this.rafId = requestAnimationFrame(loop);
      if (!this.ctx) return;

      // Update currentTime for deck A
      if (this.state.deckA.isPlaying && this.sourceA) {
        const t = Math.min(
          this.ctx.currentTime - this.startTimeA,
          this.state.deckA.duration
        );
        // Loop enforcement
        if (this.state.deckA.loopActive && this.state.deckA.loop) {
          const [ls, le] = this.state.deckA.loop;
          if (t >= le - 0.05) { this.seek("A", ls); return; }
        }
        if (Math.abs(t - this.state.deckA.currentTime) > 0.1) {
          this.state = {
            ...this.state,
            deckA: { ...this.state.deckA, currentTime: t },
          };
          this.notify();
        }
      }

      // Update currentTime for deck B
      if (this.state.deckB.isPlaying && this.sourceB) {
        const t = Math.min(
          this.ctx.currentTime - this.startTimeB,
          this.state.deckB.duration
        );
        // Loop enforcement
        if (this.state.deckB.loopActive && this.state.deckB.loop) {
          const [ls, le] = this.state.deckB.loop;
          if (t >= le - 0.05) { this.seek("B", ls); return; }
        }
        if (Math.abs(t - this.state.deckB.currentTime) > 0.1) {
          this.state = {
            ...this.state,
            deckB: { ...this.state.deckB, currentTime: t },
          };
          this.notify();
        }
      }
    };
    this.rafId = requestAnimationFrame(loop);
  }

  // ─── State management ─────────────────────────────────────────────────────

  private updateDeck(deck: "A" | "B", patch: Partial<DeckState>) {
    if (deck === "A") {
      this.state = { ...this.state, deckA: { ...this.state.deckA, ...patch } };
    } else {
      this.state = { ...this.state, deckB: { ...this.state.deckB, ...patch } };
    }
    this.notify();
  }

  getState(): EngineState { return this.state; }

  subscribe(listener: StateListener): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private notify() {
    this.listeners.forEach(l => l(this.state));
  }
}

// Singleton
export const engine = new AudioEngine();
