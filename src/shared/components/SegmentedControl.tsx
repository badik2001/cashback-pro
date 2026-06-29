import type { ReactNode } from "react";

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface SegmentedControlProps {
  value: string;
  onChange: (value: string) => void;
  options: SegmentedOption[];
  className?: string;
}

/**
 * iOS-style segmented control with a sliding pill indicator.
 * All segments share equal width, so the indicator's position
 * and width can be expressed purely with CSS percentages —
 * no measuring/layout-effect needed.
 */
export default function SegmentedControl({ value, onChange, options, className = "" }: SegmentedControlProps) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const count = options.length;

  return (
    <div
      role="tablist"
      className={`relative grid p-1 rounded-2xl bg-muted/70 dark:bg-white/[0.06] border border-border ${className}`}
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      <div
        className="absolute top-1 bottom-1 rounded-xl bg-card shadow-md transition-transform duration-200 ease-out"
        style={{
          width: `calc(${100 / count}% - 4px)`,
          transform: `translateX(calc(${index * 100}% + ${index * 4}px))`,
        }}
      />
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.value)}
            className={`relative z-[1] flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors tap-highlight-none ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
