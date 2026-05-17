import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PaginationProps {
  /** 0-based current page index (matches Spring's Page.number) */
  currentPage: number;
  totalPages: number;
  /** Builds the URL for a given 0-based page number */
  buildHref: (page: number) => string;
  className?: string;
}

// ── Page number range logic ───────────────────────────────────────────────────

/**
 * Returns the page indices to render, inserting `null` where an ellipsis (…) goes.
 * Always shows first, last, and a window of 2 around the current page.
 *
 * Examples (0-based, totalPages=10):
 *   currentPage=0  → [0, 1, 2, null, 9]
 *   currentPage=4  → [0, null, 3, 4, 5, null, 9]
 *   currentPage=9  → [0, null, 7, 8, 9]
 */
function buildPageRange(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);

  const range = new Set<number>();
  range.add(0);
  range.add(total - 1);

  for (let i = Math.max(0, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    range.add(i);
  }

  const sorted = Array.from(range).sort((a, b) => a - b);
  const result: (number | null)[] = [];

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push(null); // ellipsis placeholder
    }
    result.push(sorted[i]);
  }

  return result;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PageButton({
  href,
  active,
  disabled,
  children,
  ariaLabel,
}: {
  href?: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  const base =
    "flex h-9 min-w-9 items-center justify-center rounded-xl px-3 text-sm font-semibold transition-all select-none";

  if (disabled || !href) {
    return (
      <span
        aria-label={ariaLabel}
        aria-disabled
        className={cn(base, "opacity-30 cursor-not-allowed text-foreground")}
      >
        {children}
      </span>
    );
  }

  if (active) {
    return (
      <Link
        href={href}
        aria-current="page"
        aria-label={ariaLabel}
        className={cn(
          base,
          "bg-accent text-accent-foreground shadow-md shadow-accent/20 dark:shadow-accent/10"
        )}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={cn(
        base,
        "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function Pagination({
  currentPage,
  totalPages,
  buildHref,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageRange = buildPageRange(currentPage, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-1", className)}
    >
      {/* Previous */}
      <PageButton
        href={currentPage > 0 ? buildHref(currentPage - 1) : undefined}
        disabled={currentPage === 0}
        ariaLabel="Previous page"
      >
        <ChevronLeft size={16} />
      </PageButton>

      {/* Page numbers */}
      {pageRange.map((page, idx) =>
        page === null ? (
          <span
            key={`ellipsis-${idx}`}
            className="flex h-9 w-9 items-center justify-center text-muted-foreground"
            aria-hidden
          >
            <MoreHorizontal size={16} />
          </span>
        ) : (
          <PageButton
            key={page}
            href={buildHref(page)}
            active={page === currentPage}
            ariaLabel={`Page ${page + 1}`}
          >
            {page + 1}
          </PageButton>
        )
      )}

      {/* Next */}
      <PageButton
        href={currentPage < totalPages - 1 ? buildHref(currentPage + 1) : undefined}
        disabled={currentPage >= totalPages - 1}
        ariaLabel="Next page"
      >
        <ChevronRight size={16} />
      </PageButton>
    </nav>
  );
}
