import * as React from "react";
import { cn } from "@/lib/utils";

const glassBase = `
  relative w-full overflow-hidden rounded-3xl backdrop-blur-xl transition-all duration-300
  
  /* LIGHT MODE: Mocne, mleczne szkło z wyraźnymi krawędziami */
  border border-white/60 border-t-white/80 
  bg-gradient-to-br from-white/70 to-white/30 
  shadow-xl shadow-black/5
  
  /* DARK MODE: Mroczne szkło z subtelnym światłem na górze */
  dark:border-white/5 dark:border-t-white/10 
  dark:from-white/[0.04] dark:to-transparent 
  dark:shadow-black/40
`;

const glassHover = `
  hover:-translate-y-1 hover:shadow-2xl 
  
  /* LIGHT MODE HOVER */
  hover:shadow-black/10 hover:from-white/80 hover:to-white/40
  
  /* DARK MODE HOVER */
  dark:hover:shadow-black/50 dark:hover:from-white/[0.06] dark:hover:to-white/[0.01] 
  group
`;

export function GlassPanel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(glassBase, className)} {...props}>
      {children}
    </div>
  );
}

export function GlassCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(glassBase, glassHover, className)} {...props}>
      {children}
    </div>
  );
}
