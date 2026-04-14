"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Star } from "lucide-react";

// ─── Left Branding Panel (Redesigned) ─────────────────────────────────────────

function BrandPanel() {
  return (
    <div className="relative hidden lg:flex lg:flex-col lg:justify-between bg-gradient-to-br from-[#080F20] to-[#102240] p-12 text-white overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/4 -left-16 h-64 w-64 rounded-full bg-[#102240]/10 blur-3xl" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent shadow-lg">
          <span className="text-sm font-black text-white">CB</span>
        </div>
        <span className="text-xl font-bold tracking-tight">ClearBook</span>
      </div>

      {/* Main Content & Glassmorphism Card */}
      <div className="relative z-10 mt-auto mb-12 space-y-10">
        <div>
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            The modern standard <br />
            for healthcare scheduling.
          </h2>
          <p className="mt-4 max-w-sm text-base text-white/70">
            Join thousands of patients and licensed professionals using
            ClearBook to simplify their medical appointments.
          </p>
        </div>

        {/* Floating Testimonial Card */}
        <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-2xl max-w-md">
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={16} className="fill-accent text-accent" />
            ))}
          </div>
          <p className="text-sm leading-relaxed text-white/90">
            "ClearBook has completely transformed how I manage my practice. The
            scheduling is seamless, and my patients love how easy it is to book
            an appointment."
          </p>
          <div className="mt-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-accent to-[#102240] p-[2px]">
              <div className="h-full w-full rounded-full border-2 border-primary bg-primary-light" />
            </div>
            <div>
              <p className="text-sm font-semibold">Dr. Sarah Jenkins</p>
              <p className="text-xs text-white/60">Cardiologist</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 flex justify-between text-xs text-white/40">
        <p>© {new Date().getFullYear()} ClearBook.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-white transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Terms of Service
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Page Layout ──────────────────────────────────────────────────────────────

export default function AuthPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <BrandPanel />

      <div className="flex flex-col bg-background">
        <div className="flex items-center justify-between px-8 pt-6">
          <div className="flex items-center gap-2 lg:invisible">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-xs font-black text-accent">CB</span>
            </div>
            <span className="text-sm font-bold text-foreground">ClearBook</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-8 py-12">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Welcome back
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to your account or register a new one.
              </p>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="register">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <LoginForm />
              </TabsContent>

              <TabsContent value="register">
                <RegisterForm />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
