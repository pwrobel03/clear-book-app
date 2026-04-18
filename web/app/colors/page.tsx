"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

// ─── Typy ─────────────────────────────────────────────────────────────────────
type Swatch = {
  name: string;
  light: string;
  dark: string;
  lightText?: boolean;
};
type Section = { title: string; swatches: Swatch[] };

// ─── Zaktualizowana Paleta (Jasny: Frost, Ciemny: Deep Slate) ─────────────────
const palette: Section[] = [
  {
    title: "Structure Color",
    swatches: [
      { name: "Primary", light: "#1c3935", dark: "#35634f", lightText: true },
      {
        name: "Primary Dark",
        light: "#122522",
        dark: "#234235",
        lightText: true,
      },
      {
        name: "Primary Light",
        light: "#3d5c58",
        dark: "#47856a",
        lightText: true,
      },
    ],
  },
  {
    title: "Action Color (Darkened Forest)",
    swatches: [
      { name: "Accent", light: "#246b50", dark: "#1a4d3a", lightText: true },
      {
        name: "Accent Dark",
        light: "#1a4d3a",
        dark: "#143a2c",
        lightText: true,
      },
      {
        name: "Accent Light",
        light: "#3a9674",
        dark: "#2e6c51",
        lightText: true,
      },
    ],
  },
  {
    title: "Backgrounds & Surfaces",
    swatches: [
      { name: "Background", light: "#f4f8f9", dark: "#0c1316" },
      { name: "Card", light: "#ffffff", dark: "#151f24" },
      { name: "Muted", light: "#e7eeef", dark: "#20292e" },
      { name: "Secondary", light: "#deeaeb", dark: "#252e33" },
    ],
  },
  {
    title: "Text",
    swatches: [
      {
        name: "Foreground",
        light: "#1c3935",
        dark: "#f4f8f9",
        lightText: true,
      },
      { name: "Muted Fg", light: "#5c7975", dark: "#7b8b94", lightText: true },
      {
        name: "Secondary Fg",
        light: "#2d524d",
        dark: "#e0e6e8",
        lightText: true,
      },
    ],
  },
  {
    title: "Borders",
    swatches: [
      { name: "Border", light: "#dbe7e8", dark: "#2d383e" },
      { name: "Input", light: "#dbe7e8", dark: "#2d383e" },
      {
        name: "Ring / Focus",
        light: "#246b50",
        dark: "#357d60",
        lightText: true,
      },
    ],
  },
];

// ─── Swatch ───────────────────────────────────────────────────────────────────
function ColorSwatch({ swatch, isDark }: { swatch: Swatch; isDark: boolean }) {
  const hex = isDark ? swatch.dark : swatch.light;
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="h-20 w-20 rounded-2xl shadow-soft ring-1 ring-black/5 dark:ring-white/5 transition-transform hover:scale-105 cursor-default"
        style={{ backgroundColor: hex }}
      />
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-foreground leading-tight">
          {swatch.name}
        </p>
        <p className="font-mono text-[10px] text-muted-foreground">{hex}</p>
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
function ColorSection({
  section,
  isDark,
}: {
  section: Section;
  isDark: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
          {section.title}
        </h2>
      </div>
      <div className="flex flex-wrap gap-8">
        {section.swatches.map((swatch) => (
          <ColorSwatch key={swatch.name} swatch={swatch} isDark={isDark} />
        ))}
      </div>
    </div>
  );
}

// ─── Strona ───────────────────────────────────────────────────────────────────
export default function ColorsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-glass">
              <span className="text-xs font-black text-primary-foreground">
                CB
              </span>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight">
                ClearBook
              </span>
              <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Design System v2.1
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {mounted ? (isDark ? "Dark 🌙" : "Light ☀️") : ""}
            </span>
            <ThemeToggle className="rounded-xl" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="space-y-12">
          {palette.map((section, i) => (
            <div
              key={section.title}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <ColorSection
                section={section}
                isDark={mounted ? isDark : false}
              />
              {i < palette.length - 1 && (
                <div className="mt-12 border-t border-border/50" />
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
