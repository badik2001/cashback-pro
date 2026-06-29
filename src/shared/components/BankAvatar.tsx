interface BankAvatarProps {
  name: string;
  color?: string;
  letter?: string;
  size?: number;
  /** Square (squircle) avatar instead of the default circle */
  square?: boolean;
  className?: string;
}

export default function BankAvatar({ name, color, letter, size = 36, square = false, className = "" }: BankAvatarProps) {
  const initial = (letter || name || "?").trim().charAt(0).toUpperCase();
  return (
    <div
      className={`shrink-0 flex items-center justify-center font-semibold text-white shadow-md ${square ? "rounded-2xl" : "rounded-full"} ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: color || "#86177D",
      }}
    >
      {initial}
    </div>
  );
}
