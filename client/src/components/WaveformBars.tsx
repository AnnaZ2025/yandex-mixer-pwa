/**
 * WaveformBars — декоративные анимированные полосы эквалайзера.
 * Используются в заголовке и при воспроизведении трека.
 */

interface WaveformBarsProps {
  count?: number;
  active?: boolean;
  className?: string;
  color?: string;
}

const DELAYS = [0, 0.15, 0.3, 0.1, 0.25, 0.05, 0.35, 0.2];
const HEIGHTS = [0.6, 1.0, 0.7, 0.9, 0.5, 0.8, 0.65, 0.95];

export default function WaveformBars({
  count = 8,
  active = true,
  className = "",
  color = "#00FF88",
}: WaveformBarsProps) {
  return (
    <div
      className={`flex items-end gap-[2px] ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: `${(HEIGHTS[i % HEIGHTS.length] * 20)}px`,
            backgroundColor: color,
            borderRadius: 1,
            opacity: active ? 0.9 : 0.3,
            animation: active
              ? `waveform-bar ${0.6 + (i % 3) * 0.15}s ease-in-out ${DELAYS[i % DELAYS.length]}s infinite`
              : "none",
            transformOrigin: "bottom",
          }}
        />
      ))}
    </div>
  );
}
