import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-black/[0.07] dark:bg-white/[0.07]",
        className
      )}
    />
  );
}
