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

type Section = {
  title: string;
  swatches: Swatch[];
};

// ─── Palette ──────────────────────────────────────────────────────────────────

const palette: Section[] = [
  {
    title: "Navy — Structure Color",
    swatches: [
      { name: "Primary", light: "#102240", dark: "#3A62A0", lightText: true },
      {
        name: "Primary Dark",
        light: "#080F20",
        dark: "#102240",
        lightText: true,
      },
      {
        name: "Primary Light",
        light: "#2A4F8A",
        dark: "#6A9AD4",
        lightText: true,
      },
    ],
  },
  {
    title: "Green — Action Color",
    swatches: [
      { name: "Accent", light: "#36A372", dark: "#36A372", lightText: true },
      {
        name: "Accent Dark",
        light: "#297A56",
        dark: "#297A56",
        lightText: true,
      },
      {
        name: "Accent Light",
        light: "#5BC48A",
        dark: "#5BC48A",
        lightText: true,
      },
    ],
  },
  {
    title: "Backgrounds & Surfaces",
    swatches: [
      { name: "Background", light: "#F0EBE9", dark: "#070D1A" },
      { name: "Card", light: "#FFFFFF", dark: "#0D1829" },
      { name: "Muted", light: "#EBE5E2", dark: "#101E2E" },
      { name: "Secondary", light: "#E3DAD6", dark: "#142338" },
    ],
  },
  {
    title: "Text",
    swatches: [
      {
        name: "Foreground",
        light: "#102240",
        dark: "#F0EBE9",
        lightText: true,
      },
      { name: "Muted Fg", light: "#5A7090", dark: "#7A90A8", lightText: true },
      {
        name: "Secondary Fg",
        light: "#2A4F8A",
        dark: "#C8D8E8",
        lightText: true,
      },
    ],
  },
  {
    title: "Borders",
    swatches: [
      { name: "Border", light: "#D9D0CC", dark: "#1A2E48" },
      { name: "Input", light: "#D9D0CC", dark: "#1A2E48" },
      {
        name: "Ring / Focus",
        light: "#36A372",
        dark: "#36A372",
        lightText: true,
      },
    ],
  },
  {
    title: "Semantic",
    swatches: [
      { name: "Success", light: "#36A372", dark: "#36A372", lightText: true },
      { name: "Warning", light: "#F59E0B", dark: "#F59E0B", lightText: true },
      {
        name: "Destructive",
        light: "#EF4444",
        dark: "#EF4444",
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
        className="h-20 w-20 rounded-xl shadow-sm ring-1 ring-black/10 dark:ring-white/10 transition-transform hover:scale-105 cursor-default"
        style={{ backgroundColor: hex }}
      />
      <div className="text-center">
        <p className="text-xs font-semibold text-foreground leading-tight">
          {swatch.name}
        </p>
        <p className="font-mono text-[11px] text-muted-foreground">{hex}</p>
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
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
          {section.title}
        </h2>
      </div>
      <div className="flex flex-wrap gap-6">
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#102240]">
              <span className="text-xs font-black text-[#36A372]">CB</span>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-foreground">
                ClearBook
              </span>
              <span className="ml-2 text-xs text-muted-foreground">
                Design System — Color Palette
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {mounted ? (isDark ? "Dark mode 🌙" : "Light mode ☀️") : ""}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="space-y-10">
          {palette.map((section, i) => (
            <div key={section.title}>
              <ColorSection
                section={section}
                isDark={mounted ? isDark : false}
              />
              {i < palette.length - 1 && (
                <div className="mt-10 border-t border-border" />
              )}
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          CSS custom properties · HSL format · shadcn/ui compatible · Tailwind
          CSS v3
        </p>
      </main>
    </div>
  );
}
