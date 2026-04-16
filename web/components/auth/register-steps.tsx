"use client";

import { useState, useRef } from "react";
import { useFormContext } from "react-hook-form";
import {
  User,
  Stethoscope,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  Upload,
  FileText,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { RegisterFormData } from "./register-form";

// ─── KROK 1: Wybór Roli ────────────────────────────────────────────────────────

export function RoleSelectionStep({ onNext }: { onNext: () => void }) {
  const { control } = useFormContext<RegisterFormData>();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          How will you use ClearBook?
        </h3>
        <p className="text-sm text-muted-foreground">
          Select the account type that fits your needs.
        </p>
      </div>

      <FormField
        control={control}
        name="role"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <div className="grid gap-3">
                <div
                  onClick={() => field.onChange("USER")}
                  className={cn(
                    "flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all",
                    field.value === "USER"
                      ? "border-accent bg-accent/5 text-accent"
                      : "border-border text-muted-foreground hover:border-accent/40 hover:bg-accent/5",
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      field.value === "USER" ? "bg-accent/20" : "bg-muted",
                    )}
                  >
                    <User size={24} />
                  </div>
                  <div>
                    <span className="block font-semibold text-foreground">
                      I am a Patient
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Book appointments and manage health.
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => field.onChange("DOCTOR")}
                  className={cn(
                    "flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all",
                    field.value === "DOCTOR"
                      ? "border-accent bg-accent/5 text-accent"
                      : "border-border text-muted-foreground hover:border-accent/40 hover:bg-accent/5",
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      field.value === "DOCTOR" ? "bg-accent/20" : "bg-muted",
                    )}
                  >
                    <Stethoscope size={24} />
                  </div>
                  <div>
                    <span className="block font-semibold text-foreground">
                      I am a Doctor
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Manage your schedule and patients.
                    </span>
                  </div>
                </div>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Button type="button" onClick={onNext} className="w-full h-11 text-base">
        Continue <ArrowRight size={18} className="ml-2" />
      </Button>
    </div>
  );
}

// ─── KROK 2: Dane Osobowe ──────────────────────────────────────────────────────

interface PersonalDetailsStepProps {
  onNext: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  serverError: string | null;
  role: "USER" | "DOCTOR";
}

export function PersonalDetailsStep({
  onNext,
  onBack,
  isSubmitting,
  serverError,
  role,
}: PersonalDetailsStepProps) {
  const { control } = useFormContext<RegisterFormData>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-muted-foreground">
                First name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="John"
                  className="h-11 bg-muted/20"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-muted-foreground">Last name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Doe"
                  className="h-11 bg-muted/20"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-muted-foreground">
              Email address
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <Input
                  type="email"
                  placeholder="john.doe@example.com"
                  className="pl-10 h-11 bg-muted/20"
                  {...field}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-3">
        <FormField
          control={control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-muted-foreground">Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={18}
                  />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 chars"
                    className="pl-10 pr-10 h-11 bg-muted/20"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-muted-foreground">Confirm</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={18}
                  />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat password"
                    className="pl-10 pr-10 h-11 bg-muted/20"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {serverError && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive mt-4">
          {serverError}
        </p>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-11 px-4"
        >
          <ArrowLeft size={18} />
        </Button>
        <Button
          type="button"
          onClick={onNext}
          className="flex-1 h-11 text-base shadow-sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : role === "DOCTOR" ? (
            <>
              Continue <ArrowRight size={18} className="ml-2" />
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── KROK 3: Weryfikacja Lekarza ──────────────────────────────────────────────

interface DoctorVerificationStepProps {
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  serverError: string | null;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
}

export function DoctorVerificationStep({
  onBack,
  onSubmit,
  isSubmitting,
  serverError,
  selectedFile,
  setSelectedFile,
}: DoctorVerificationStepProps) {
  const { control } = useFormContext<RegisterFormData>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          Verify your license
        </h3>
        <p className="text-sm text-muted-foreground">
          Please upload your medical certification to proceed.
        </p>
      </div>

      <FormField
        control={control}
        name="document"
        render={({ field: { onChange, ref, value, ...rest } }) => (
          <FormItem>
            <FormControl>
              <div className="pt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setSelectedFile(file);
                    onChange(e.target.files);
                  }}
                  {...rest}
                />
                {selectedFile ? (
                  <div className="flex items-center gap-3 rounded-xl border border-accent/40 bg-accent/5 px-4 py-4">
                    <FileText size={20} className="shrink-0 text-accent" />
                    <span className="flex-1 truncate text-sm font-medium text-foreground">
                      {selectedFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        onChange(undefined);
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/20 px-4 py-10 text-center transition-colors hover:border-accent/50 hover:bg-accent/5"
                  >
                    <Upload size={28} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Click to upload document
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        PDF, JPG, or PNG (Max 10 MB)
                      </p>
                    </div>
                  </button>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {serverError && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-11 px-4"
          disabled={isSubmitting}
        >
          <ArrowLeft size={18} />
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          className="flex-1 h-11 text-base shadow-sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            "Submit Application"
          )}
        </Button>
      </div>
    </div>
  );
}
