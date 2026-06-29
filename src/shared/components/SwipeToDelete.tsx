import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";

interface SwipeToDeleteProps {
  children: ReactNode;
  onDelete: () => void;
  /** Which way the user swipes the content to reveal the delete action */
  direction: "left" | "right";
  className?: string;
  deleteLabel?: string;
  /** Disable swipe (e.g. while a row is being inline-edited) */
  disabled?: boolean;
}

const REVEAL_PX = 88;
const THRESHOLD_PX = 36;

export default function SwipeToDelete({
  children,
  onDelete,
  direction,
  className = "",
  deleteLabel,
  disabled = false,
}: SwipeToDeleteProps) {
  const [revealed, setRevealed] = useState(false);
  const startX = useRef(0);
  const dragging = useRef(false);

  const sign = direction === "left" ? -1 : 1;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    dragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const delta = e.touches[0].clientX - startX.current;
    // Only react to movement in the configured direction
    if (sign < 0 ? delta < -THRESHOLD_PX : delta > THRESHOLD_PX) {
      setRevealed(true);
    } else if (sign < 0 ? delta > -8 : delta < 8) {
      setRevealed(false);
    }
  };

  const handleTouchEnd = () => {
    dragging.current = false;
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className={`absolute inset-y-0 flex items-center ${direction === "left" ? "right-0" : "left-0"}`}
        style={{ width: REVEAL_PX }}
      >
        <button
          type="button"
          onClick={() => {
            setRevealed(false);
            onDelete();
          }}
          aria-label={deleteLabel || "Удалить"}
          className="w-full h-full flex flex-col items-center justify-center gap-1 bg-destructive text-destructive-foreground text-xs font-medium rounded-2xl"
        >
          <Trash2 className="w-4 h-4" />
          {deleteLabel}
        </button>
      </div>
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative transition-transform duration-200"
        style={{ transform: revealed ? `translateX(${sign * REVEAL_PX}px)` : "translateX(0)" }}
      >
        {children}
      </div>
    </div>
  );
}
