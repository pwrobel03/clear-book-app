"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

// ─── Typy ────────────────────────────────────────────────────────────────────

type Swatch = {
  name: string;
  light: string;
  dark: string;
  textDark?: boolean; // czy tekst na swatchu ma być ciemny (dla jasnych kolorów)
};

type Section = {
  title: string;
  swatches: Swatch[];
};

// ─── Dane palety ──────────────────────────────────────────────────────────────

const palette: Section[] = [
  {
    title: "Marka",
    swatches: [
      { name: "Primary", light: "#2563EB", dark: "#3B82F6" },
      { name: "Primary Dark", light: "#1D4ED8", dark: "#2563EB" },
      { name: "Primary Light", light: "#60A5FA", dark: "#93C5FD" },
    ],
  },
  {
    title: "Tła i Powierzchnie",
    swatches: [
      { name: "Background", light: "#F8FAFD", dark: "#0D1117", textDark: true },
      { name: "Card", light: "#FFFFFF", dark: "#161B22", textDark: true },
      { name: "Muted", light: "#F1F5F9", dark: "#1E293B", textDark: true },
      { name: "Secondary", light: "#EFF6FF", dark: "#1E2D40", textDark: true },
    ],
  },
  {
    title: "Tekst",
    swatches: [
      { name: "Foreground", light: "#111827", dark: "#F1F5F9" },
      { name: "Muted Fg", light: "#64748B", dark: "#94A3B8" },
      { name: "Secondary Fg", light: "#1D4ED8", dark: "#93C5FD" },
      { name: "Accent Fg", light: "#1D4ED8", dark: "#60A5FA" },
    ],
  },
  {
    title: "Akcenty i Obramowania",
    swatches: [
      { name: "Accent", light: "#DBEAFE", dark: "#1E3A5F", textDark: true },
      { name: "Border", light: "#E2E8F0", dark: "#30363D", textDark: true },
      { name: "Input", light: "#E2E8F0", dark: "#30363D", textDark: true },
      { name: "Ring", light: "#2563EB", dark: "#60A5FA" },
    ],
  },
  {
    title: "Semantyczne",
    swatches: [
      { name: "Success", light: "#22C55E", dark: "#22C55E" },
      { name: "Warning", light: "#F59E0B", dark: "#F59E0B" },
      { name: "Destructive", light: "#EF4444", dark: "#EF4444" },
    ],
  },
];

// ─── Komponent swatchu ────────────────────────────────────────────────────────

function ColorSwatch({
  swatch,
  isDark,
}: {
  swatch: Swatch;
  isDark: boolean;
}) {
  const hex = isDark ? swatch.dark : swatch.light;
  const lightText = !swatch.textDark;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="h-20 w-20 rounded-xl shadow-md ring-1 ring-black/5 dark:ring-white/10 transition-transform hover:scale-105"
        style={{ backgroundColor: hex }}
      />
      <div className="text-center">
        <p className="text-xs font-medium text-foreground">{swatch.name}</p>
        <p className="font-mono text-xs text-muted-foreground">{hex}</p>
      </div>
    </div>
  );
}

// ─── Komponent sekcji ─────────────────────────────────────────────────────────

function ColorSection({
  section,
  isDark,
}: {
  section: Section;
  isDark: boolean;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {section.title}
      </h2>
      <div className="flex flex-wrap gap-6">
        {section.swatches.map((swatch) => (
          <ColorSwatch key={swatch.name} swatch={swatch} isDark={isDark} />
        ))}
      </div>
    </div>
  );
}

// ─── Strona /colors ───────────────────────────────────────────────────────────

export default function ColorsPage() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <div className="min-h-screen bg-background">
      {/* Nagłówek */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <span className="text-lg font-bold tracking-tight text-primary">
              ClearBook
            </span>
            <span className="ml-2 text-xs text-muted-foreground">
              Design System
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Treść */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Tytuł */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Paleta Kolorów
          </h1>
          <p className="mt-2 text-muted-foreground">
            Kolory dla trybu{" "}
            <span className="font-medium text-foreground">
              {mounted ? (isDark ? "ciemnego 🌙" : "jasnego ☀️") : "..."}
            </span>
            . Użyj przełącznika w prawym górnym rogu, aby porównać.
          </p>
        </div>

        {/* Sekcje */}
        <div className="space-y-10">
          {palette.map((section) => (
            <div key={section.title}>
              <ColorSection
                section={section}
                isDark={mounted ? isDark : false}
              />
              <div className="mt-10 border-t border-border" />
            </div>
          ))}
        </div>

        {/* Stopka */}
        <p className="mt-10 text-center text-xs text-muted-foreground">
          Wszystkie kolory zdefiniowane jako CSS custom properties —
          kompatybilne z{" "}
          <span className="font-mono">shadcn/ui</span> i{" "}
          <span className="font-mono">Tailwind CSS</span>.
        </p>
      </main>
    </div>
  );
}
