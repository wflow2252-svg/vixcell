interface IconProps {
  name: string
  size?: number
  filled?: boolean
  className?: string
}

/**
 * Google Material Symbols (Rounded) icon.
 * Bundled offline via the `material-symbols` package — no CDN.
 * Browse names at https://fonts.google.com/icons
 */
export default function Icon({ name, size = 20, filled = false, className = '' }: IconProps) {
  return (
    <span
      className={`material-symbols-rounded ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${Math.min(Math.max(size, 20), 48)}`,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}
