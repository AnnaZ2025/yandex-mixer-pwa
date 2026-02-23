/**
 * EQKnob — круглая ручка эквалайзера.
 * Управление: drag вверх/вниз или touch.
 * value: 0–1 (0.5 = нейтральное положение, 0 dB)
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

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div
        className="relative w-10 h-10 rounded-full cursor-grab active:cursor-grabbing"
        style={{ background: "radial-gradient(circle at 35% 35%, #2a2a2a, #0d0d0d)", boxShadow: `0 0 0 1px #333, 0 2px 8px rgba(0,0,0,0.8)` }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onDoubleClick={() => onChange(0.5)}
        title="Double-click to reset"
      >
        {/* Indicator dot */}
        <div
          className="absolute w-1.5 h-1.5 rounded-full top-1 left-1/2 -translate-x-1/2"
          style={{
            background: color,
            transformOrigin: "50% 18px",
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            boxShadow: `0 0 4px ${color}`,
          }}
        />
        {/* Ring */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="17" fill="none" stroke="#1a1a1a" strokeWidth="2" />
          <circle
            cx="20" cy="20" r="17"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeDasharray={`${Math.abs(value - 0.5) * 53.4} 106.8`}
            strokeDashoffset={value >= 0.5 ? -26.7 : 26.7 - Math.abs(value - 0.5) * 53.4}
            opacity="0.7"
          />
        </svg>
      </div>
      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className="text-[8px] font-mono" style={{ color: db === 0 ? "#555" : color }}>{dbStr}</span>
    </div>
  );
}
