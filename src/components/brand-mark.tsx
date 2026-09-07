import { cn } from "@/lib/utils";

/**
 * eTwin Assistant brand mark: two interlocking rings (the partner schools)
 * with a shared dot in the middle (the joint project).
 *
 * `tone`:
 *  - "onBlue": white mark, for use on the blue brand tile (default)
 *  - "color":  blue + teal rings with a dark dot, for light backgrounds
 *  - "colorDark": light blue + teal rings with a white dot, for dark backgrounds
 */
export type BrandMarkTone = "onBlue" | "color" | "colorDark";

interface BrandMarkProps {
  size?: number;
  tone?: BrandMarkTone;
  className?: string;
  title?: string;
}

const TONES: Record<BrandMarkTone, { left: string; right: string; rightOpacity: number; dot: string }> = {
  onBlue: { left: "#FFFFFF", right: "#FFFFFF", rightOpacity: 0.55, dot: "#FFFFFF" },
  color: { left: "#1F3A60", right: "#0D9488", rightOpacity: 1, dot: "#0F172A" },
  colorDark: { left: "#64D2FF", right: "#2DD4BF", rightOpacity: 1, dot: "#FFFFFF" },
};

export function BrandMark({ size = 24, tone = "onBlue", className, title = "eTwin Assistant" }: BrandMarkProps) {
  const c = TONES[tone];
  // Slightly heavier strokes at small sizes keep the rings legible.
  const stroke = size <= 20 ? 9 : size <= 32 ? 8 : 7;
  const dot = size <= 20 ? 0 : size <= 32 ? 6 : 5;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      <circle cx="25" cy="32" r="17" stroke={c.left} strokeWidth={stroke} />
      <circle cx="39" cy="32" r="17" stroke={c.right} strokeWidth={stroke} strokeOpacity={c.rightOpacity} />
      {dot > 0 && <circle cx="32" cy="32" r={dot} fill={c.dot} />}
    </svg>
  );
}

interface BrandTileProps {
  /** Tile edge in px. The mark scales with it. */
  size?: number;
  className?: string;
}

/** The brand mark on its blue rounded tile, used as the app icon in the UI. */
export function BrandTile({ size = 36, className }: BrandTileProps) {
  const mark = Math.round(size * 0.68);
  const radius = size >= 56 ? "rounded-2xl" : size >= 32 ? "rounded-xl" : "rounded-lg";
  return (
    <div
      className={cn("flex items-center justify-center bg-blue-600 text-white flex-shrink-0", radius, className)}
      style={{ width: size, height: size }}
    >
      <BrandMark size={mark} tone="onBlue" />
    </div>
  );
}
