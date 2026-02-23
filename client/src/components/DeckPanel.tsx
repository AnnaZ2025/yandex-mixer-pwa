/**
 * DeckPanel — одна дека DJ-стола (A или B).
 * Мобильно-оптимизированная версия: крупные кнопки, зоны касания 48px+,
 * контекстные подсказки, улучшенная читаемость.
 *
 * Design: Dark Studio — #080808 bg, #00FF88 accent A, #FF6B35 accent B
 */
import { useCallback } from "react";
import { Play, Pause, SkipBack, Loader2, Plus } from "lucide-react";
import { engine, DeckState } from "@/lib/audioEngine";
import WaveformCanvas from "./WaveformCanvas";
import EQKnob from "./EQKnob";
import TooltipHint from "./TooltipHint";

interface Props {
  deck: "A" | "B";
  state: DeckState;
  hint: "now" | "wait" | "urgent" | null;
  onSelectTrack: () => void;
  compatibilityScore?: number;
}

const ACCENT_A = "#00FF88";
const ACCENT_B = "#FF6B35";

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function DeckPanel({ deck, state, hint, onSelectTrack, compatibilityScore }: Props) {
  const accent = deck === "A" ? ACCENT_A : ACCENT_B;
  const label = deck === "A" ? "ДЕКА A" : "ДЕКА B";
  const deckLetter = deck === "A" ? "A" : "B";

  const togglePlay = useCallback(() => {
    if (state.isPlaying) engine.pause(deck);
    else engine.play(deck);
  }, [deck, state.isPlaying]);

  const restart = useCallback(() => {
    engine.seek(deck, 0);
  }, [deck]);

  const hintConfig = {
    now: { text: "Хороший момент для перехода", color: "#00FF88", bg: "rgba(0,255,136,0.08)" },
    urgent: { text: "Трек заканчивается! Двигай фейдер", color: "#FF4444", bg: "rgba(255,68,68,0.08)" },
    wait: { text: "Подожди немного...", color: "#666", bg: "transparent" },
  };

  const progress = state.duration > 0 ? state.currentTime / state.duration : 0;

  return (
    <div
      id={`deck-${deckLetter.toLowerCase()}`}
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #141414 0%, #0d0d0d 100%)",
        border: `1px solid ${accent}28`,
        boxShadow: `0 0 30px ${accent}06`,
      }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: `1px solid ${accent}15`, background: `${accent}06` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-mono font-bold tracking-[0.2em] px-2.5 py-1 rounded-lg"
            style={{ color: accent, background: `${accent}18`, border: `1px solid ${accent}33` }}
          >
            {label}
          </span>
          {state.bpm && (
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-md"
              style={{ color: accent, background: `${accent}12`, border: `1px solid ${accent}25` }}
            >
              {state.bpm} BPM
            </span>
          )}
        </div>

        {/* Compatibility */}
        {compatibilityScore !== undefined && (
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: compatibilityScore >= 75 ? "#00FF88" : compatibilityScore >= 50 ? "#FFB800" : "#FF4444",
                boxShadow: `0 0 6px ${compatibilityScore >= 75 ? "#00FF88" : compatibilityScore >= 50 ? "#FFB800" : "#FF4444"}`,
              }}
            />
            <span className="text-[10px] font-mono text-zinc-500">
              {compatibilityScore}% совм.
            </span>
            <TooltipHint
              text="Совместимость треков по BPM. Зелёный — переход будет чистым, красный — темп сильно отличается."
              position="left"
            />
          </div>
        )}
      </div>

      {/* ── Track selector ─────────────────────────────────────── */}
      <button
        onClick={onSelectTrack}
        className="flex items-center gap-3 mx-3 mt-3 p-3 rounded-xl text-left transition-all active:scale-98"
        style={{
          background: state.trackId ? "#161616" : `${accent}08`,
          border: state.trackId ? "1px solid #222" : `1px dashed ${accent}40`,
          minHeight: "64px",
        }}
      >
        {state.coverUri ? (
          <img
            src={state.coverUri.startsWith("http") ? state.coverUri.replace("200x200", "80x80") : `https://${state.coverUri.replace("%%", "80x80")}`}
            alt=""
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
            style={{ boxShadow: `0 0 12px ${accent}30` }}
          />
        ) : (
          <div
            className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{ background: `${accent}12`, border: `1px dashed ${accent}35` }}
          >
            <Plus className="w-6 h-6" style={{ color: `${accent}80` }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {state.trackId ? (
            <>
              <p className="text-sm font-semibold text-white truncate leading-tight">
                {state.trackTitle}
              </p>
              <p className="text-xs text-zinc-400 truncate mt-0.5">{state.trackArtist}</p>
              <p className="text-[10px] font-mono mt-1" style={{ color: `${accent}80` }}>
                Нажми для смены трека
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold" style={{ color: accent }}>
                Выбрать трек
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Нажми, чтобы открыть плейлисты
              </p>
            </>
          )}
        </div>
        {state.isLoading && (
          <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" style={{ color: accent }} />
        )}
      </button>

      {/* ── Waveform ───────────────────────────────────────────── */}
      <div className="mx-3 mt-3 relative rounded-xl overflow-hidden" style={{ height: "72px", background: "#0a0a0a" }}>
        <WaveformCanvas
          deck={deck}
          waveformData={state.waveformData}
          currentTime={state.currentTime}
          duration={state.duration}
          isPlaying={state.isPlaying}
          hint={hint}
          accentColor={accent}
        />
        {!state.trackId && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-mono text-zinc-600">Загрузи трек для отображения волны</span>
          </div>
        )}
      </div>

      {/* ── Progress bar + time ────────────────────────────────── */}
      <div className="mx-3 mt-1.5 flex items-center gap-2">
        <span className="text-[10px] font-mono w-10 flex-shrink-0" style={{ color: accent }}>
          {formatTime(state.currentTime)}
        </span>
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "#1a1a1a" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress * 100}%`,
              background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
            }}
          />
        </div>
        <span className="text-[10px] font-mono w-10 text-right flex-shrink-0 text-zinc-600">
          -{formatTime(Math.max(0, state.duration - state.currentTime))}
        </span>
      </div>

      {/* ── AI Hint banner ─────────────────────────────────────── */}
      {hint && hint !== "wait" && (
        <div
          className="mx-3 mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono"
          style={{
            background: hintConfig[hint].bg,
            border: `1px solid ${hintConfig[hint].color}35`,
            color: hintConfig[hint].color,
          }}
        >
          <div
            className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
            style={{ background: hintConfig[hint].color }}
          />
          <span>AI: {hintConfig[hint].text}</span>
        </div>
      )}

      {/* ── Controls + EQ ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-3 mt-1">
        {/* Playback controls */}
        <div className="flex items-center gap-2">
          {/* Restart */}
          <button
            onClick={restart}
            className="flex items-center justify-center rounded-xl transition-all active:scale-95"
            style={{
              width: "44px",
              height: "44px",
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
            }}
            aria-label="В начало"
          >
            <SkipBack className="w-4 h-4 text-zinc-400" />
          </button>

          {/* Play/Pause — крупная кнопка для пальца */}
          <button
            onClick={togglePlay}
            disabled={!state.trackId || state.isLoading}
            className="flex items-center justify-center rounded-2xl transition-all active:scale-95 disabled:opacity-30"
            style={{
              width: "60px",
              height: "60px",
              background: state.isPlaying ? `${accent}20` : accent,
              border: `2px solid ${accent}`,
              color: state.isPlaying ? accent : "#000",
              boxShadow: state.isPlaying ? `0 0 20px ${accent}30` : `0 4px 20px ${accent}40`,
            }}
            aria-label={state.isPlaying ? "Пауза" : "Воспроизвести"}
          >
            {state.isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : state.isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </button>
        </div>

        {/* EQ section */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">EQ</span>
            <TooltipHint
              text="Крути ручки вверх/вниз для управления частотами. Двойное касание сбрасывает в центр."
              position="left"
            />
          </div>
          <div className="flex items-end gap-3">
            <EQKnob
              label="BASS"
              value={state.bass}
              onChange={(v) => engine.setEQ(deck, "bass", v)}
              color={accent}
            />
            <EQKnob
              label="MID"
              value={state.mid}
              onChange={(v) => engine.setEQ(deck, "mid", v)}
              color={accent}
            />
            <EQKnob
              label="TREBLE"
              value={state.treble}
              onChange={(v) => engine.setEQ(deck, "treble", v)}
              color={accent}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
