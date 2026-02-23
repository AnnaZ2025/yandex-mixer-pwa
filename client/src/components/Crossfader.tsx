/**
 * Crossfader — горизонтальный DJ-кроссфейдер.
 * value: 0 = full A, 1 = full B, 0.5 = center
 */
import { useRef, useCallback } from "react";
import { engine } from "@/lib/audioEngine";

interface Props {
  value: number;
}

export default function Crossfader({ value }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  const getValueFromEvent = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track) return 0.5;
    const rect = track.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return x / rect.width;
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    engine.setCrossfader(getValueFromEvent(e.clientX));

    const onMove = (me: MouseEvent) => engine.setCrossfader(getValueFromEvent(me.clientX));
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [getValueFromEvent]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    engine.setCrossfader(getValueFromEvent(e.touches[0].clientX));
    const onMove = (te: TouchEvent) => engine.setCrossfader(getValueFromEvent(te.touches[0].clientX));
    const onEnd = () => {
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
  }, [getValueFromEvent]);

  const pct = value * 100;
  const isCenter = Math.abs(value - 0.5) < 0.02;

  return (
    <div className="flex flex-col items-center gap-2 w-full px-4">
      {/* Labels */}
      <div className="flex justify-between w-full">
        <span
          className="text-xs font-mono font-bold tracking-widest"
          style={{ color: value < 0.5 ? "#00FF88" : "#444", transition: "color 0.15s" }}
        >
          A
        </span>
        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
          CROSSFADER
        </span>
        <span
          className="text-xs font-mono font-bold tracking-widest"
          style={{ color: value > 0.5 ? "#FF6B35" : "#444", transition: "color 0.15s" }}
        >
          B
        </span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative w-full h-12 rounded-full cursor-pointer select-none"
        style={{
          background: "linear-gradient(90deg, #00FF8822 0%, #111 50%, #FF6B3522 100%)",
          border: "1px solid #2a2a2a",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.6)",
        }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {/* Center marker */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-6"
          style={{ background: "#333" }}
        />

        {/* Fill gradient */}
        <div
          className="absolute top-0 bottom-0 rounded-full pointer-events-none"
          style={{
            left: value < 0.5 ? `${pct}%` : "50%",
            right: value > 0.5 ? `${100 - pct}%` : "50%",
            background: value < 0.5
              ? "linear-gradient(90deg, transparent, rgba(0,255,136,0.15))"
              : "linear-gradient(90deg, rgba(255,107,53,0.15), transparent)",
          }}
        />

        {/* Handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            left: `calc(${pct}% - 20px)`,
            background: isCenter
              ? "linear-gradient(135deg, #2a2a2a, #1a1a1a)"
              : value < 0.5
              ? "linear-gradient(135deg, #00FF8844, #1a1a1a)"
              : "linear-gradient(135deg, #FF6B3544, #1a1a1a)",
            border: `2px solid ${isCenter ? "#333" : value < 0.5 ? "#00FF8866" : "#FF6B3566"}`,
            boxShadow: `0 2px 12px rgba(0,0,0,0.8), 0 0 ${isCenter ? "0px" : "8px"} ${value < 0.5 ? "#00FF8844" : "#FF6B3544"}`,
            transition: "border-color 0.1s, box-shadow 0.1s",
          }}
        >
          {/* Grip lines */}
          <div className="flex flex-col gap-0.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-4 h-px" style={{ background: "#444" }} />
            ))}
          </div>
        </div>
      </div>

      {/* Position indicator */}
      <div className="flex gap-1 items-center">
        {isCenter ? (
          <span className="text-[10px] font-mono text-zinc-600">CENTER</span>
        ) : (
          <span className="text-[10px] font-mono" style={{ color: value < 0.5 ? "#00FF88" : "#FF6B35" }}>
            {value < 0.5 ? `A ${Math.round((0.5 - value) * 200)}%` : `B ${Math.round((value - 0.5) * 200)}%`}
          </span>
        )}
      </div>
    </div>
  );
}
