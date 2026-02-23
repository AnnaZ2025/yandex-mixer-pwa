/**
 * DeckPanel — одна дека DJ-стола (A или B).
 * Содержит: обложка + мета, волна, EQ, кнопки управления.
 */
import { useCallback } from "react";
import { Play, Pause, SkipBack, Loader2 } from "lucide-react";
import { engine, DeckState } from "@/lib/audioEngine";
import WaveformCanvas from "./WaveformCanvas";
import EQKnob from "./EQKnob";

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
  const label = deck === "A" ? "DECK A" : "DECK B";

  const togglePlay = useCallback(() => {
    if (state.isPlaying) engine.pause(deck);
    else engine.play(deck);
  }, [deck, state.isPlaying]);

  const restart = useCallback(() => {
    engine.seek(deck, 0);
  }, [deck]);

  const hintConfig = {
    now: { text: "Хороший момент для перехода", color: "#00FF88", bg: "rgba(0,255,136,0.1)" },
    urgent: { text: "Трек заканчивается!", color: "#FF4444", bg: "rgba(255,68,68,0.1)" },
    wait: { text: "Подожди немного...", color: "#888", bg: "transparent" },
  };

  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-xl border"
      style={{
        background: "linear-gradient(135deg, #111 0%, #0d0d0d 100%)",
        borderColor: `${accent}22`,
        boxShadow: `0 0 20px ${accent}08`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-mono font-bold tracking-[0.2em] px-2 py-0.5 rounded"
          style={{ color: accent, background: `${accent}18`, border: `1px solid ${accent}33` }}
        >
          {label}
        </span>
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
              {compatibilityScore}% совместимость
            </span>
          </div>
        )}
      </div>

      {/* Track info */}
      <div
        className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
        style={{ background: "#161616", border: "1px solid #222" }}
        onClick={onSelectTrack}
      >
        {state.coverUri ? (
          <img
            src={`https://${state.coverUri.replace("%%", "60x60")}`}
            alt=""
            className="w-12 h-12 rounded object-cover flex-shrink-0"
            style={{ boxShadow: `0 0 10px ${accent}30` }}
          />
        ) : (
          <div
            className="w-12 h-12 rounded flex-shrink-0 flex items-center justify-center"
            style={{ background: `${accent}15`, border: `1px dashed ${accent}40` }}
          >
            <span className="text-lg">+</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {state.trackId ? state.trackTitle : "Выбрать трек"}
          </p>
          <p className="text-xs text-zinc-500 truncate">{state.trackArtist || "Нажмите для выбора"}</p>
          {state.bpm && (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded mt-0.5 inline-block"
              style={{ color: accent, background: `${accent}15` }}
            >
              {state.bpm} BPM
            </span>
          )}
        </div>
        {state.isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-zinc-500 flex-shrink-0 ml-auto" />
        )}
      </div>

      {/* Waveform */}
      <div className="relative h-20 rounded overflow-hidden" style={{ background: "#0d0d0d" }}>
        <WaveformCanvas
          deck={deck}
          waveformData={state.waveformData}
          currentTime={state.currentTime}
          duration={state.duration}
          isPlaying={state.isPlaying}
          hint={hint}
          accentColor={accent}
        />
      </div>

      {/* Time */}
      <div className="flex justify-between text-[10px] font-mono text-zinc-600 -mt-1 px-0.5">
        <span style={{ color: accent }}>{formatTime(state.currentTime)}</span>
        <span>-{formatTime(Math.max(0, state.duration - state.currentTime))}</span>
      </div>

      {/* AI Hint */}
      {hint && hint !== "wait" && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono"
          style={{
            background: hintConfig[hint].bg,
            border: `1px solid ${hintConfig[hint].color}40`,
            color: hintConfig[hint].color,
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
            style={{ background: hintConfig[hint].color }}
          />
          AI: {hintConfig[hint].text}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={restart}
            className="w-8 h-8 rounded flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
          >
            <SkipBack className="w-3.5 h-3.5 text-zinc-400" />
          </button>
          <button
            onClick={togglePlay}
            disabled={!state.trackId || state.isLoading}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
            style={{
              background: state.isPlaying ? `${accent}22` : accent,
              border: `1px solid ${accent}`,
              color: state.isPlaying ? accent : "#000",
            }}
          >
            {state.isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : state.isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>
        </div>

        {/* EQ */}
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
  );
}
