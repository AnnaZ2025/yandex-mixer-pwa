/**
 * Crossfader — горизонтальный DJ-кроссфейдер.
 * Мобильно-оптимизированная версия: крупная зона касания, визуальные метки,
 * подсказка, haptic feedback через vibration API.
 *
 * value: 0 = full A, 1 = full B, 0.5 = center
 */
import { useRef, useCallback } from "react";
import { engine } from "@/lib/audioEngine";
import TooltipHint from "./TooltipHint";

interface Props {
  value: number;
}

export default function Crossfader({ value }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const lastSnap = useRef<number | null>(null);

  const getValueFromEvent = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track) return 0.5;
    const rect = track.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return x / rect.width;
  }, []);

  const snapToCenter = useCallback((v: number): number => {
    // Snap to center (0.5) within ±3%
    if (Math.abs(v - 0.5) < 0.03) {
      if (lastSnap.current !== 0.5) {
        lastSnap.current = 0.5;
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(20);
      }
      return 0.5;
    }
    lastSnap.current = v;
    return v;
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    engine.setCrossfader(snapToCenter(getValueFromEvent(e.clientX)));
    const onMove = (me: MouseEvent) => engine.setCrossfader(snapToCenter(getValueFromEvent(me.clientX)));
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [getValueFromEvent, snapToCenter]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    engine.setCrossfader(snapToCenter(getValueFromEvent(e.touches[0].clientX)));
    const onMove = (te: TouchEvent) => engine.setCrossfader(snapToCenter(getValueFromEvent(te.touches[0].clientX)));
    const onEnd = () => {
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
  }, [getValueFromEvent, snapToCenter]);

  const pct = value * 100;
  const isCenter = Math.abs(value - 0.5) < 0.03;
  const posLabel = isCenter
    ? "CENTER"
    : value < 0.5
    ? `← A ${Math.round((0.5 - value) * 200)}%`
    : `B ${Math.round((value - 0.5) * 200)}% →`;

  return (
    <div className="flex flex-col gap-3 px-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            Кроссфейдер
          </span>
          <TooltipHint
            text="Тяни влево — слышна Дека A. Тяни вправо — слышна Дека B. В центре — оба трека поровну. Снэп к центру при отпускании."
            position="bottom"
          />
        </div>
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded-md transition-all"
          style={{
            color: isCenter ? "#666" : value < 0.5 ? "#00FF88" : "#FF6B35",
            background: isCenter ? "#1a1a1a" : value < 0.5 ? "#00FF8812" : "#FF6B3512",
            border: `1px solid ${isCenter ? "#2a2a2a" : value < 0.5 ? "#00FF8830" : "#FF6B3530"}`,
          }}
        >
          {posLabel}
        </span>
      </div>

      {/* Labels */}
      <div className="flex justify-between items-center px-1">
        <div className="flex flex-col items-center gap-0.5">
          <span
            className="text-base font-mono font-black tracking-widest transition-all"
            style={{
              color: value < 0.5 ? "#00FF88" : "#2a2a2a",
              textShadow: value < 0.5 ? "0 0 12px #00FF8860" : "none",
              transform: value < 0.5 ? "scale(1.1)" : "scale(1)",
              transition: "all 0.15s",
            }}
          >
            A
          </span>
          <span className="text-[8px] font-mono text-zinc-700">ДЕКА A</span>
        </div>

        {/* Track */}
        <div
          ref={trackRef}
          className="flex-1 mx-3 relative rounded-full cursor-pointer select-none"
          style={{
            height: "56px",
            background: "linear-gradient(90deg, #00FF8818 0%, #111 50%, #FF6B3518 100%)",
            border: "1px solid #252525",
            boxShadow: "inset 0 2px 10px rgba(0,0,0,0.7)",
          }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
        >
          {/* Center snap marker */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 pointer-events-none"
          >
            <div className="w-px h-5" style={{ background: isCenter ? "#00FF8860" : "#2a2a2a" }} />
          </div>

          {/* Fill */}
          <div
            className="absolute top-0 bottom-0 rounded-full pointer-events-none transition-all"
            style={{
              left: value < 0.5 ? `${pct}%` : "50%",
              right: value > 0.5 ? `${100 - pct}%` : "50%",
              background: value < 0.5
                ? "linear-gradient(90deg, transparent, rgba(0,255,136,0.12))"
                : "linear-gradient(90deg, rgba(255,107,53,0.12), transparent)",
            }}
          />

          {/* Handle — крупный для пальца */}
          <div
            className="absolute top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-all"
            style={{
              width: "48px",
              height: "48px",
              left: `calc(${pct}% - 24px)`,
              background: isCenter
                ? "linear-gradient(135deg, #2a2a2a, #1c1c1c)"
                : value < 0.5
                ? "linear-gradient(135deg, #00FF8830, #1a1a1a)"
                : "linear-gradient(135deg, #FF6B3530, #1a1a1a)",
              border: `2px solid ${isCenter ? "#333" : value < 0.5 ? "#00FF8870" : "#FF6B3570"}`,
              boxShadow: `0 2px 16px rgba(0,0,0,0.9), 0 0 ${isCenter ? "0px" : "16px"} ${value < 0.5 ? "#00FF8830" : "#FF6B3530"}`,
            }}
          >
            {/* Grip lines */}
            <div className="flex flex-col gap-1">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className="rounded-full"
                  style={{
                    width: "18px",
                    height: "2px",
                    background: isCenter ? "#3a3a3a" : value < 0.5 ? "#00FF8850" : "#FF6B3550",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <span
            className="text-base font-mono font-black tracking-widest transition-all"
            style={{
              color: value > 0.5 ? "#FF6B35" : "#2a2a2a",
              textShadow: value > 0.5 ? "0 0 12px #FF6B3560" : "none",
              transform: value > 0.5 ? "scale(1.1)" : "scale(1)",
              transition: "all 0.15s",
            }}
          >
            B
          </span>
          <span className="text-[8px] font-mono text-zinc-700">ДЕКА B</span>
        </div>
      </div>

      {/* Tick marks */}
      <div className="flex justify-between px-10 -mt-1">
        {[0, 25, 50, 75, 100].map(tick => (
          <div key={tick} className="flex flex-col items-center gap-0.5">
            <div className="w-px h-1.5" style={{ background: "#2a2a2a" }} />
            <span className="text-[8px] font-mono text-zinc-700">{tick === 50 ? "C" : ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
