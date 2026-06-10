import Link from "next/link";
import { BrandLogo } from "./ui/brand-logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-8 mt-auto relative z-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <BrandLogo size={28} />
          <span className="text-sm font-semibold text-foreground">
            ClearBook
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} ClearBook. All rights reserved.
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <Link href="#" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="#" className="hover:text-foreground transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
