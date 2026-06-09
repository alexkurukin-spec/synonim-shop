import Image from "next/image"
import { clx } from "@medusajs/ui"

/**
 * СИНОНИМ logo.
 *
 * Placeholder SVGs live in `/public/logo/`; replace them with the final brand
 * files (same names). Logo rules per brand brief §1:
 *  - 3 versions: color (default), black (light bg), white (dark/saturated bg)
 *  - min on-screen width 80px
 *  - do not recolor / skew / add shadows / change proportions
 */
type LogoVariant = "color" | "black" | "white"

const SRC: Record<LogoVariant, string> = {
  color: "/logo/synonim-color.svg",
  black: "/logo/synonim-black.svg",
  white: "/logo/synonim-white.svg",
}

const Logo = ({
  variant = "color",
  className,
  width = 160,
  height = 36,
  priority = false,
}: {
  variant?: LogoVariant
  className?: string
  width?: number
  height?: number
  priority?: boolean
}) => {
  return (
    <Image
      src={SRC[variant]}
      alt="СИНОНИМ — серебро с выращенными бриллиантами"
      width={width}
      height={height}
      priority={priority}
      // min on-screen width 80px (brand rule)
      className={clx("h-auto w-auto min-w-[80px]", className)}
    />
  )
}

export default Logo
