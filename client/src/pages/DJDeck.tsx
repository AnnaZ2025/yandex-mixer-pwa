/**
 * DJDeck — главный экран DJ-стола.
 *
 * Компоновка (мобильная, вертикальная):
 *  ┌─────────────────────────────┐
 *  │  Header (статус + BPM sync) │
 *  ├─────────────────────────────┤
 *  │  Deck A                     │
 *  ├─────────────────────────────┤
 *  │  Crossfader                 │
 *  ├─────────────────────────────┤
 *  │  Deck B                     │
 *  ├─────────────────────────────┤
 *  │  AI Assistant panel         │
 *  └─────────────────────────────┘
 */
import { useState, useCallback, useEffect } from "react";
import { Zap, Music, ArrowLeftRight } from "lucide-react";
import { engine } from "@/lib/audioEngine";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import DeckPanel from "@/components/DeckPanel";
import Crossfader from "@/components/Crossfader";
import TrackSelector from "@/components/TrackSelector";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

type SelectorTarget = "A" | "B" | null;

export default function DJDeck() {
  const state = useAudioEngine();
  const [selectorTarget, setSelectorTarget] = useState<SelectorTarget>(null);
  const [aiMessage, setAiMessage] = useState<string>("Загрузи треки на обе деки, чтобы начать микс");
  const [syncPulse, setSyncPulse] = useState(false);

  // AI assistant logic
  useEffect(() => {
    const hintA = engine.getTransitionHint("A");
    const hintB = engine.getTransitionHint("B");
    const score = engine.getCompatibilityScore();
    const bpmA = state.deckA.bpm;
    const bpmB = state.deckB.bpm;

    if (!state.deckA.trackId && !state.deckB.trackId) {
      setAiMessage("Загрузи треки на обе деки, чтобы начать микс");
    } else if (!state.deckA.trackId) {
      setAiMessage("Загрузи трек на Деку A");
    } else if (!state.deckB.trackId) {
      setAiMessage("Загрузи трек на Деку B — он будет следующим");
    } else if (hintA === "urgent") {
      setAiMessage("Трек A заканчивается! Двигай фейдер вправо прямо сейчас");
    } else if (hintB === "urgent") {
      setAiMessage("Трек B заканчивается! Двигай фейдер влево прямо сейчас");
    } else if (hintA === "now" && state.crossfader < 0.3) {
      setAiMessage(`Хороший момент для перехода — плавно двигай фейдер вправо`);
    } else if (hintB === "now" && state.crossfader > 0.7) {
      setAiMessage(`Хороший момент для перехода — плавно двигай фейдер влево`);
    } else if (score < 40 && bpmA && bpmB) {
      setAiMessage(`BPM сильно отличаются (${bpmA} vs ${bpmB}) — нажми Sync для выравнивания`);
    } else if (score >= 80) {
      setAiMessage(`Отличная совместимость! Переход будет чистым`);
    } else if (state.deckA.isPlaying && state.deckB.isPlaying) {
      setAiMessage(`Оба трека играют — управляй фейдером для микса`);
    } else if (state.deckA.isPlaying || state.deckB.isPlaying) {
      setAiMessage(`Запусти вторую деку и начинай переход`);
    } else {
      setAiMessage(`Нажми Play на любой деке`);
    }
  }, [state]);

  const handleSync = useCallback(() => {
    const activeDeck = state.deckA.isPlaying ? "A" : "B";
    engine.syncBPM(activeDeck);
    setSyncPulse(true);
    setTimeout(() => setSyncPulse(false), 600);
  }, [state.deckA.isPlaying]);

  const hintA = engine.getTransitionHint("A");
  const hintB = engine.getTransitionHint("B");
  const score = engine.getCompatibilityScore();

  const aiMsgColor =
    aiMessage.includes("заканчивается") || aiMessage.includes("прямо сейчас")
      ? "#FF4444"
      : aiMessage.includes("Отличная") || aiMessage.includes("чистым")
      ? "#00FF88"
      : aiMessage.includes("Хороший")
      ? "#FFB800"
      : "#888";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#080808", fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "#1a1a1a", background: "#0a0a0a" }}
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
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <span style={{ color: "#00FF88" }}>{state.deckA.bpm}</span>
              <span className="text-zinc-600">BPM</span>
              <span className="text-zinc-600">vs</span>
              <span style={{ color: "#FF6B35" }}>{state.deckB.bpm}</span>
              <span className="text-zinc-600">BPM</span>
            </div>
          )}

          {/* Sync button */}
          <button
            onClick={handleSync}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
            style={{
              background: syncPulse ? "#00FF8833" : "#1a1a1a",
              border: `1px solid ${syncPulse ? "#00FF88" : "#2a2a2a"}`,
              color: syncPulse ? "#00FF88" : "#666",
            }}
          >
            <ArrowLeftRight className="w-3 h-3" />
            SYNC
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col gap-3 p-3 overflow-y-auto">
        {/* Deck A */}
        <DeckPanel
          deck="A"
          state={state.deckA}
          hint={hintA}
          onSelectTrack={() => setSelectorTarget("A")}
          compatibilityScore={state.deckA.trackId && state.deckB.trackId ? score : undefined}
        />

        {/* Crossfader */}
        <div
          className="py-4 px-2 rounded-xl border"
          style={{ background: "#0d0d0d", borderColor: "#1a1a1a" }}
        >
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
          className="flex items-start gap-3 p-4 rounded-xl border"
          style={{
            background: "#0a0a0a",
            borderColor: `${aiMsgColor}22`,
            boxShadow: `0 0 20px ${aiMsgColor}08`,
          }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: `${aiMsgColor}18`, border: `1px solid ${aiMsgColor}33` }}
          >
            <Zap className="w-3.5 h-3.5" style={{ color: aiMsgColor }} />
          </div>
          <div>
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-1">
              AI Подсказка
            </p>
            <p className="text-sm font-medium" style={{ color: aiMsgColor }}>
              {aiMessage}
            </p>
          </div>
        </div>

        {/* Tips */}
        <div
          className="p-3 rounded-xl text-[10px] font-mono text-zinc-600 space-y-1"
          style={{ background: "#0a0a0a", border: "1px solid #111" }}
        >
          <p>• Двигай фейдер влево/вправо для перехода между треками</p>
          <p>• Крути EQ-ручки для управления частотами (двойной клик = сброс)</p>
          <p>• Нажми на волну для перемотки трека</p>
          <p>• SYNC выравнивает BPM второго трека под первый</p>
        </div>
      </div>

      {/* Track selector modal */}
      {selectorTarget && (
        <TrackSelector
          deck={selectorTarget}
          apiBase={API_BASE}
          onClose={() => setSelectorTarget(null)}
        />
      )}
    </div>
  );
}
