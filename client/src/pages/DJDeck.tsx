/**
 * DJDeck — главный экран DJ-стола.
 *
 * Мобильная компоновка (вертикальная):
 *  ┌─────────────────────────────┐
 *  │  Header (статус + BPM sync) │
 *  ├─────────────────────────────┤
 *  │  Deck A                     │
 *  ├─────────────────────────────┤
 *  │  Crossfader (крупный)       │
 *  ├─────────────────────────────┤
 *  │  Deck B                     │
 *  ├─────────────────────────────┤
 *  │  AI Assistant panel         │
 *  └─────────────────────────────┘
 *
 * Design: Dark Studio — #080808 bg, #00FF88 accent, JetBrains Mono
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { Zap, Music, ArrowLeftRight, HelpCircle, RotateCcw, Shuffle } from "lucide-react";
import { engine } from "@/lib/audioEngine";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import DeckPanel from "@/components/DeckPanel";
import Crossfader from "@/components/Crossfader";
import TrackSelector from "@/components/TrackSelector";
import OnboardingOverlay from "@/components/OnboardingOverlay";
import SpectrumVisualizer from "@/components/SpectrumVisualizer";
import MixHistory, { saveMixEntry } from "@/components/MixHistory";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

type SelectorTarget = "A" | "B" | null;

interface AiState {
  message: string;
  color: string;
  urgency: "info" | "good" | "warning" | "danger";
}

/** Плавно анимирует кроссфейдер от from до to за durationMs миллисекунд */
function animateCrossfader(from: number, to: number, durationMs: number, onDone?: () => void) {
  const startTime = performance.now();
  const step = (now: number) => {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / durationMs, 1);
    // ease-in-out cubic
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const value = from + (to - from) * eased;
    engine.setCrossfader(value);
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      onDone?.();
    }
  };
  requestAnimationFrame(step);
}

export default function DJDeck() {
  const state = useAudioEngine();
  const [selectorTarget, setSelectorTarget] = useState<SelectorTarget>(null);
  const [syncPulse, setSyncPulse] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [autoMixActive, setAutoMixActive] = useState(false);
  const autoMixRef = useRef(false);
  const [aiState, setAiState] = useState<AiState>({
    message: "Загрузи треки на обе деки, чтобы начать микс",
    color: "#666",
    urgency: "info",
  });

  // Show onboarding on first visit
  useEffect(() => {
    const done = localStorage.getItem("dj_onboarding_done");
    if (!done) {
      setShowOnboarding(true);
    }
  }, []);

  // AI assistant logic
  useEffect(() => {
    const hintA = engine.getTransitionHint("A");
    const hintB = engine.getTransitionHint("B");
    const score = engine.getCompatibilityScore();
    const bpmA = state.deckA.bpm;
    const bpmB = state.deckB.bpm;

    let message = "";
    let color = "#666";
    let urgency: AiState["urgency"] = "info";

    if (autoMixRef.current) {
      message = "AUTO MIX активен — плавный переход идёт...";
      color = "#00FF88";
      urgency = "good";
    } else if (!state.deckA.trackId && !state.deckB.trackId) {
      message = "Нажми на блок с «+» на Деке A, чтобы выбрать первый трек";
      color = "#666";
      urgency = "info";
    } else if (!state.deckA.trackId) {
      message = "Загрузи трек на Деку A — нажми на блок с «+»";
      color = "#00FF88";
      urgency = "info";
    } else if (!state.deckB.trackId) {
      message = "Отлично! Теперь загрузи следующий трек на Деку B";
      color = "#FF6B35";
      urgency = "info";
    } else if (!state.deckA.isPlaying && !state.deckB.isPlaying) {
      message = "Оба трека загружены! Нажми ▶ на Деке A, чтобы начать";
      color = "#00FF88";
      urgency = "good";
    } else if (state.deckA.isPlaying && !state.deckB.isPlaying) {
      message = "Дека A играет. Нажми AUTO MIX для автоматического перехода на B";
      color = "#FFB800";
      urgency = "warning";
    } else if (hintA === "urgent") {
      message = "⚡ Трек A заканчивается! Двигай фейдер вправо прямо сейчас!";
      color = "#FF4444";
      urgency = "danger";
    } else if (hintB === "urgent") {
      message = "⚡ Трек B заканчивается! Двигай фейдер влево прямо сейчас!";
      color = "#FF4444";
      urgency = "danger";
    } else if (hintA === "now" && state.crossfader < 0.3) {
      message = "Хороший момент! Нажми AUTO MIX или тяни фейдер вправо";
      color = "#00FF88";
      urgency = "good";
    } else if (hintB === "now" && state.crossfader > 0.7) {
      message = "Хороший момент! Тяни фейдер влево для перехода на A";
      color = "#00FF88";
      urgency = "good";
    } else if (score < 40 && bpmA && bpmB) {
      message = `BPM сильно отличаются (${bpmA} vs ${bpmB}) — нажми SYNC для выравнивания`;
      color = "#FFB800";
      urgency = "warning";
    } else if (score >= 80) {
      message = "Отличная совместимость! Нажми AUTO MIX для плавного перехода";
      color = "#00FF88";
      urgency = "good";
    } else if (state.deckA.isPlaying && state.deckB.isPlaying) {
      message = "Оба трека играют — управляй фейдером или нажми AUTO MIX";
      color = "#888";
      urgency = "info";
    } else {
      message = "Нажми ▶ на любой деке";
      color = "#666";
      urgency = "info";
    }

    setAiState({ message, color, urgency });
  }, [state, autoMixActive]);

  const handleSync = useCallback(() => {
    const activeDeck = state.deckA.isPlaying ? "A" : "B";
    engine.syncBPM(activeDeck);
    setSyncPulse(true);
    setTimeout(() => setSyncPulse(false), 600);
  }, [state.deckA.isPlaying]);

  /** AUTO MIX: синхронизирует BPM, запускает Деку B, плавно переходит фейдером */
  const handleAutoMix = useCallback(() => {
    if (autoMixRef.current) {
      // Отменить AUTO MIX
      autoMixRef.current = false;
      setAutoMixActive(false);
      return;
    }

    const deckAHasTrack = !!state.deckA.trackId;
    const deckBHasTrack = !!state.deckB.trackId;

    if (!deckAHasTrack || !deckBHasTrack) return;

    autoMixRef.current = true;
    setAutoMixActive(true);

    // 1. Определяем направление: если A играет — переходим на B, иначе на A
    const fromDeck = state.deckA.isPlaying ? "A" : "B";
    const toDeck = fromDeck === "A" ? "B" : "A";
    const targetCrossfader = toDeck === "B" ? 1 : 0;

    // 2. Запускаем целевую деку если не играет
    const toPlaying = toDeck === "A" ? state.deckA.isPlaying : state.deckB.isPlaying;
    if (!toPlaying) {
      engine.play(toDeck);
    }

    // 3. Синхронизируем BPM
    if (state.deckA.bpm && state.deckB.bpm) {
      engine.syncBPM(fromDeck);
    }

    // 4. Сохраняем в историю
    saveMixEntry({
      trackA: {
        id: state.deckA.trackId || "",
        title: state.deckA.trackTitle || "",
        artist: state.deckA.trackArtist || "",
        coverUri: state.deckA.coverUri || null,
        bpm: state.deckA.bpm || null,
      },
      trackB: {
        id: state.deckB.trackId || "",
        title: state.deckB.trackTitle || "",
        artist: state.deckB.trackArtist || "",
        coverUri: state.deckB.coverUri || null,
        bpm: state.deckB.bpm || null,
      },
      crossfadeType: "auto",
    });

    // 5. Плавный переход за 20 секунд
    const currentCrossfader = state.crossfader;
    animateCrossfader(currentCrossfader, targetCrossfader, 20000, () => {
      if (!autoMixRef.current) return;
      // 6. Останавливаем исходную деку
      engine.pause(fromDeck);
      autoMixRef.current = false;
      setAutoMixActive(false);
    });
  }, [state]);

  const hintA = engine.getTransitionHint("A");
  const hintB = engine.getTransitionHint("B");
  const score = engine.getCompatibilityScore();

  const canAutoMix = !!state.deckA.trackId && !!state.deckB.trackId;

  const urgencyBg: Record<AiState["urgency"], string> = {
    info: "#0a0a0a",
    good: "#00FF8808",
    warning: "#FFB80008",
    danger: "#FF444412",
  };

  return (
    <div
      className="min-h-screen flex flex-col pb-20"
      style={{ background: "#080808", fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* ── Header ───────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3 sticky top-0 z-10"
        style={{ borderBottom: "1px solid #1a1a1a", background: "#0a0a0a" }}
      >
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4" style={{ color: "#00FF88" }} />
          <span className="text-sm font-bold tracking-widest text-white uppercase">
            DJ Mixer
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* BPM display */}
          {state.deckA.bpm && state.deckB.bpm && (
            <div
              className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-lg"
              style={{ background: "#111", border: "1px solid #222" }}
            >
              <span style={{ color: "#00FF88" }}>{state.deckA.bpm}</span>
              <span className="text-zinc-700">vs</span>
              <span style={{ color: "#FF6B35" }}>{state.deckB.bpm}</span>
              <span className="text-zinc-700">BPM</span>
            </div>
          )}

          {/* Auto Mix button */}
          <button
            onClick={handleAutoMix}
            disabled={!canAutoMix}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-30"
            style={{
              background: autoMixActive ? "#00FF8825" : "#1a1a1a",
              border: `1px solid ${autoMixActive ? "#00FF88" : "#2a2a2a"}`,
              color: autoMixActive ? "#00FF88" : "#555",
              minWidth: "80px",
              minHeight: "36px",
            }}
          >
            <Shuffle className={`w-3 h-3 ${autoMixActive ? "animate-pulse" : ""}`} />
            {autoMixActive ? "STOP" : "AUTO"}
          </button>

          {/* Sync button */}
          <button
            onClick={handleSync}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95"
            style={{
              background: syncPulse ? "#00FF8820" : "#1a1a1a",
              border: `1px solid ${syncPulse ? "#00FF88" : "#2a2a2a"}`,
              color: syncPulse ? "#00FF88" : "#555",
              minWidth: "60px",
              minHeight: "36px",
            }}
          >
            <ArrowLeftRight className="w-3 h-3" />
            SYNC
          </button>

          {/* Help button */}
          <button
            onClick={() => setShowOnboarding(true)}
            className="flex items-center justify-center rounded-xl transition-all active:scale-95"
            style={{
              width: "36px",
              height: "36px",
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
            }}
            aria-label="Помощь"
          >
            <HelpCircle className="w-4 h-4 text-zinc-500" />
          </button>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-3 p-3">

        {/* Deck A */}
        <DeckPanel
          deck="A"
          state={state.deckA}
          hint={hintA}
          onSelectTrack={() => setSelectorTarget("A")}
          compatibilityScore={state.deckA.trackId && state.deckB.trackId ? score : undefined}
        />

        {/* Crossfader section */}
        <div
          className="py-4 px-3 rounded-2xl"
          style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}
        >
          {/* Spectrum Visualizer */}
          {(state.deckA.isPlaying || state.deckB.isPlaying) && (
            <div className="mb-3 rounded-xl overflow-hidden" style={{ height: "80px" }}>
              <SpectrumVisualizer
                isPlayingA={state.deckA.isPlaying}
                isPlayingB={state.deckB.isPlaying}
              />
            </div>
          )}
          <Crossfader value={state.crossfader} />
        </div>

        {/* Deck B */}
        <DeckPanel
          deck="B"
          state={state.deckB}
          hint={hintB}
          onSelectTrack={() => setSelectorTarget("B")}
          compatibilityScore={state.deckA.trackId && state.deckB.trackId ? score : undefined}
        />

        {/* AI Assistant */}
        <div
          className="flex items-start gap-3 p-4 rounded-2xl border transition-all"
          style={{
            background: urgencyBg[aiState.urgency],
            borderColor: `${aiState.color}25`,
            boxShadow: aiState.urgency === "danger" ? `0 0 20px ${aiState.color}15` : "none",
          }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{
              background: `${aiState.color}15`,
              border: `1px solid ${aiState.color}30`,
            }}
          >
            <Zap
              className={`w-4 h-4 ${aiState.urgency === "danger" || autoMixActive ? "animate-pulse" : ""}`}
              style={{ color: aiState.color }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-1">
              AI Подсказка
            </p>
            <p className="text-sm font-medium leading-relaxed" style={{ color: aiState.color }}>
              {aiState.message}
            </p>
          </div>
        </div>

        {/* Mix History */}
        <MixHistory />

        {/* Quick reference card */}
        <div
          className="p-4 rounded-2xl"
          style={{ background: "#0a0a0a", border: "1px solid #141414" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
              Быстрая справка
            </span>
            <button
              onClick={() => setShowOnboarding(true)}
              className="text-[10px] font-mono ml-auto flex items-center gap-1 transition-colors hover:text-zinc-300"
              style={{ color: "#00FF8870" }}
            >
              <RotateCcw className="w-3 h-3" />
              Обучение
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: "🎵", text: "Нажми «+» для выбора трека" },
              { icon: "▶️", text: "Кнопка Play запускает деку" },
              { icon: "🎚️", text: "Фейдер = переход A→B" },
              { icon: "🎛️", text: "EQ крутится вверх/вниз" },
              { icon: "⚡", text: "SYNC выравнивает BPM" },
              { icon: "🔀", text: "AUTO = плавный переход 20с" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2 rounded-lg"
                style={{ background: "#111" }}
              >
                <span className="text-sm flex-shrink-0">{item.icon}</span>
                <span className="text-[10px] font-mono text-zinc-500 leading-relaxed">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Onboarding overlay ───────────────────────────────── */}
      {showOnboarding && (
        <OnboardingOverlay onComplete={() => setShowOnboarding(false)} />
      )}

      {/* ── Track selector modal ────────────────────────────────────────────── */}
      {selectorTarget && (
        <TrackSelector
          deck={selectorTarget}
          apiBase={API_BASE}
          onClose={() => setSelectorTarget(null)}
          referenceBpm={selectorTarget === "B" ? state.deckA.bpm : state.deckB.bpm}
        />
      )}
    </div>
  );
}
