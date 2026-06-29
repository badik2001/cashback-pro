import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface GlassSelectOption {
  value: string;
  label: string;
  /** Optional element rendered to the left of the label (e.g. a bank avatar) */
  left?: ReactNode;
  /** Optional small text rendered under the label */
  sublabel?: string;
}

interface GlassSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: GlassSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Optional element shown to the left of the trigger's own label (e.g. selected bank avatar) */
  triggerLeft?: ReactNode;
}

/**
 * Fully custom select/listbox.
 *
 * We never rely on the native <select> popup here — on many browsers
 * (especially in dark mode) the native option list ignores our CSS
 * variables and renders white-on-white. This component is themed
 * entirely with our own design tokens, so it always stays readable.
 */
export default function GlassSelect({
  value,
  onChange,
  options,
  placeholder = "Выберите...",
  className = "",
  disabled = false,
  triggerLeft,
}: GlassSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border border-border bg-white/40 dark:bg-white/[0.06] backdrop-blur-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition disabled:opacity-50 tap-highlight-none"
      >
        {selected?.left ?? triggerLeft}
        <span className={`flex-1 text-left truncate text-sm ${selected ? "text-foreground" : "text-muted-foreground"}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-50 mt-2 w-full max-h-64 overflow-y-auto rounded-2xl glass-strong glass-sheen p-1.5 animate-in"
          style={{ animation: "glass-pop 0.14s ease-out" }}
        >
          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">Нет вариантов</p>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`relative z-[2] w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition ${
                    isSelected
                      ? "bg-primary/15 text-primary font-medium"
                      : "text-foreground hover:bg-white/40 dark:hover:bg-white/10"
                  }`}
                >
                  {opt.left}
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">{opt.label}</span>
                    {opt.sublabel && <span className="block text-xs text-muted-foreground truncate">{opt.sublabel}</span>}
                  </span>
                  {isSelected && <Check className="w-4 h-4 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}

      <style>{`
        @keyframes glass-pop {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
