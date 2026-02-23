/**
 * EQKnob — круглая ручка эквалайзера.
 * Управление: drag вверх/вниз или touch.
 * value: 0–1 (0.5 = нейтральное положение, 0 dB)
 * Мобильная оптимизация: зона касания 48px+, двойной тап для сброса.
 */
import { useRef, useCallback } from "react";

interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color?: string;
}

export default function EQKnob({ label, value, onChange, color = "#00FF88" }: Props) {
  const startY = useRef<number | null>(null);
  const startVal = useRef<number>(0.5);
  const lastTap = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startY.current = e.clientY;
    startVal.current = value;

    const onMove = (me: MouseEvent) => {
      if (startY.current === null) return;
      const delta = (startY.current - me.clientY) / 120;
      const next = Math.max(0, Math.min(1, startVal.current + delta));
      onChange(next);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [value, onChange]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // Double tap to reset
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onChange(0.5);
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;

    startY.current = e.touches[0].clientY;
    startVal.current = value;
    const onMove = (te: TouchEvent) => {
      if (startY.current === null) return;
      const delta = (startY.current - te.touches[0].clientY) / 120;
      const next = Math.max(0, Math.min(1, startVal.current + delta));
      onChange(next);
    };
    const onEnd = () => {
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
  }, [value, onChange]);

  // Rotation: -135° (min) to +135° (max), 0° at 0.5
  const rotation = (value - 0.5) * 270;
  const db = Math.round((value - 0.5) * 24);
  const dbStr = db === 0 ? "0 dB" : db > 0 ? `+${db} dB` : `${db} dB`;
  const isCenter = Math.abs(db) <= 1;

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      {/* Touch target wrapper — 48x48 minimum */}
      <div
        className="flex items-center justify-center"
        style={{ width: "48px", height: "48px", touchAction: "none" }}
      >
        <div
          className="relative w-11 h-11 rounded-full cursor-grab active:cursor-grabbing"
          style={{
            background: "radial-gradient(circle at 35% 35%, #2a2a2a, #0d0d0d)",
            boxShadow: `0 0 0 1px #333, 0 2px 8px rgba(0,0,0,0.8), ${isCenter ? "none" : `0 0 12px ${color}20`}`,
          }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onDoubleClick={() => onChange(0.5)}
          title="Двойное нажатие для сброса"
        >
          {/* Indicator dot */}
          <div
            className="absolute w-1.5 h-1.5 rounded-full top-1 left-1/2 -translate-x-1/2"
            style={{
              background: isCenter ? "#444" : color,
              transformOrigin: "50% 18px",
              transform: `translateX(-50%) rotate(${rotation}deg)`,
              boxShadow: isCenter ? "none" : `0 0 4px ${color}`,
            }}
          />
          {/* Ring */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="19" fill="none" stroke="#1a1a1a" strokeWidth="2" />
            <circle
              cx="22" cy="22" r="19"
              fill="none"
              stroke={isCenter ? "#2a2a2a" : color}
              strokeWidth="2"
              strokeDasharray={`${Math.abs(value - 0.5) * 59.7} 119.4`}
              strokeDashoffset={value >= 0.5 ? -29.85 : 29.85 - Math.abs(value - 0.5) * 59.7}
              opacity="0.7"
              style={{ transition: "stroke 0.2s" }}
            />
          </svg>
        </div>
      </div>
      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className="text-[8px] font-mono" style={{ color: isCenter ? "#555" : color }}>{dbStr}</span>
    </div>
  );
}
