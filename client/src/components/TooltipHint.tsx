/**
 * TooltipHint — маленькая иконка «?» с всплывающей подсказкой.
 * Используется рядом с элементами управления для объяснения их функции.
 */
import { useState } from "react";
import { HelpCircle } from "lucide-react";

interface Props {
  text: string;
  position?: "top" | "bottom" | "left" | "right";
}

export default function TooltipHint({ text, position = "top" }: Props) {
  const [visible, setVisible] = useState(false);

  const posStyles: Record<string, React.CSSProperties> = {
    top: { bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
    bottom: { top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
    left: { right: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
    right: { left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
  };

  return (
    <div className="relative inline-flex" style={{ zIndex: 50 }}>
      <button
        onTouchStart={() => setVisible(v => !v)}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="w-5 h-5 flex items-center justify-center rounded-full opacity-40 hover:opacity-80 transition-opacity"
        style={{ background: "#1a1a1a", border: "1px solid #333" }}
        aria-label="Подсказка"
      >
        <HelpCircle className="w-3 h-3 text-zinc-400" />
      </button>

      {visible && (
        <div
          className="absolute z-50 px-3 py-2 rounded-lg text-xs font-mono text-zinc-200 pointer-events-none"
          style={{
            ...posStyles[position],
            background: "#1a1a1a",
            border: "1px solid #333",
            boxShadow: "0 4px 20px rgba(0,0,0,0.8)",
            width: "200px",
            lineHeight: "1.5",
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
