"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, UserCircle } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const SPECIALIZATIONS = [
  { value: "CARDIOLOGY", label: "Cardiology" },
  { value: "NEUROLOGY", label: "Neurology" },
  { value: "ORTHOPEDICS", label: "Orthopedics" },
  { value: "PEDIATRICS", label: "Pediatrics" },
  { value: "DERMATOLOGY", label: "Dermatology" },
  { value: "GYNECOLOGY", label: "Gynecology" },
  { value: "PSYCHIATRY", label: "Psychiatry" },
  { value: "OPHTHALMOLOGY", label: "Ophthalmology" },
  { value: "RADIOLOGY", label: "Radiology" },
  { value: "ONCOLOGY", label: "Oncology" },
  { value: "EMERGENCY_MEDICINE", label: "Emergency Medicine" },
  { value: "INTERNAL_MEDICINE", label: "Internal Medicine" },
  { value: "SURGERY", label: "Surgery" },
  { value: "UROLOGY", label: "Urology" },
  { value: "ENDOCRINOLOGY", label: "Endocrinology" },
  { value: "GASTROENTEROLOGY", label: "Gastroenterology" },
  { value: "PULMONOLOGY", label: "Pulmonology" },
  { value: "RHEUMATOLOGY", label: "Rheumatology" },
  { value: "NEPHROLOGY", label: "Nephrology" },
  { value: "HEMATOLOGY", label: "Hematology" },
  { value: "ANESTHESIOLOGY", label: "Anesthesiology" },
  { value: "FAMILY_MEDICINE", label: "Family Medicine" },
];

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  specializations: z
    .array(z.string())
    .min(1, "Select at least one specialization"),
  bio: z.string().max(1000, "Bio must be under 1000 characters").optional(),
  licenseNumber: z.string().optional(),
  isPublic: z.boolean(),
});

type FormData = z.infer<typeof schema>;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DoctorProfilePage() {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [profileExists, setProfileExists] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      specializations: [],
      bio: "",
      licenseNumber: "",
      isPublic: true,
    },
  });

  const { isSubmitting } = form.formState;
  const selected = form.watch("specializations");

  // Load existing profile
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/doctors/me/profile");
        if (res.ok) {
          const data = await res.json();
          setProfileExists(true);
          form.reset({
            specializations: data.specializations ?? [],
            bio: data.bio ?? "",
            licenseNumber: data.licenseNumber ?? "",
            isPublic: data.isPublic ?? true,
          });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [form]);

  async function onSubmit(values: FormData) {
    setServerError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/doctors/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        setSuccess(true);
        setProfileExists(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const d = await res.json();
        setServerError(d.message ?? "Failed to save profile.");
      }
    } catch {
      setServerError("Network error. Please try again.");
    }
  }

  function toggleSpecialization(value: string) {
    const current = form.getValues("specializations");
    const updated = current.includes(value)
      ? current.filter((s) => s !== value)
      : [...current, value];
    form.setValue("specializations", updated, { shouldValidate: true });
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <DashboardHeader title="My Profile" />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <DashboardHeader title="My Profile" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <UserCircle size={22} className="text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">
                {profileExists ? "Edit Profile" : "Set Up Your Profile"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {profileExists
                  ? "Update your professional information visible to patients."
                  : "Complete your profile to appear in patient searches."}
              </p>
            </div>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Specializations */}
              <FormField
                control={form.control}
                name="specializations"
                render={() => (
                  <FormItem>
                    <FormLabel>Specializations</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2 rounded-md border border-input bg-background p-3">
                        {SPECIALIZATIONS.map((s) => {
                          const active = selected.includes(s.value);
                          return (
                            <button
                              key={s.value}
                              type="button"
                              onClick={() => toggleSpecialization(s.value)}
                              className={cn(
                                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                                active
                                  ? "border-accent bg-accent text-accent-foreground"
                                  : "border-border text-muted-foreground hover:border-accent/50 hover:text-foreground",
                              )}
                            >
                              {s.label}
                            </button>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Selected:{" "}
                      {selected.length > 0
                        ? selected
                            .map(
                              (v) =>
                                SPECIALIZATIONS.find((s) => s.value === v)
                                  ?.label,
                            )
                            .join(", ")
                        : "none"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bio */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell patients about your experience, approach, and expertise..."
                        className="h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value?.length ?? 0} / 1000 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* License number */}
              <FormField
                control={form.control}
                name="licenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical License Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. PWZ-1234567" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your official medical practice number (optional — visible
                      on your profile).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Visibility */}
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
                    <div className="flex-1">
                      <FormLabel className="text-base">
                        Public Profile
                      </FormLabel>
                      <FormDescription className="mt-0.5">
                        When enabled, patients can find you in search results.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={field.value}
                        onClick={() => field.onChange(!field.value)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                          field.value ? "bg-accent" : "bg-muted",
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform",
                            field.value ? "translate-x-5" : "translate-x-0",
                          )}
                        />
                      </button>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Server error */}
              {serverError && (
                <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {serverError}
                </p>
              )}

              {/* Success */}
              {success && (
                <p className="rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
                  Profile saved successfully.
                </p>
              )}

              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {profileExists ? "Save Changes" : "Create Profile"}
              </Button>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
