import Image from "next/image";
import logoDark from "@/assets/logo.png";
import logoWhite from "@/assets/logo_white.png";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  /** Width/height in pixels (logo is square). Defaults to 32. */
  size?: number;
  /** Extra classes applied to each <img> element. */
  className?: string;
  /**
   * Force the white variant — use this on permanently-dark backgrounds
   * (e.g. the dashboard sidebar) so the logo is always visible.
   */
  alwaysWhite?: boolean;
}

/**
 * Renders the ClearBook brand mark.
 *
 * In theme-aware mode (default) it shows the dark logo in light mode and
 * the white logo in dark mode using CSS only — no client-side JS required,
 * so there is no hydration flash.
 */
export function BrandLogo({
  size = 32,
  className,
  alwaysWhite = false,
}: BrandLogoProps) {
  if (alwaysWhite) {
    return (
      <Image
        src={logoWhite}
        alt="ClearBook"
        width={size}
        height={size}
        className={cn("object-contain", className)}
        priority
      />
    );
  }

  return (
    <>
      {/* Shown in light mode, hidden in dark mode */}
      <Image
        src={logoDark}
        alt="ClearBook"
        width={size}
        height={size}
        className={cn("object-contain dark:hidden", className)}
        priority
      />
      {/* Hidden in light mode, shown in dark mode */}
      <Image
        src={logoWhite}
        alt="ClearBook"
        width={size}
        height={size}
        className={cn("object-contain hidden dark:block", className)}
        priority
      />
    </>
  );
}
