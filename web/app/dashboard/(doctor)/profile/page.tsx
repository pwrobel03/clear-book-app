"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, UserCircle } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
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

import {
  upsertProfileAction,
  getProfileAction,
  getSpecializationsAction,
} from "@/lib/actions/doctor";
import { forbidden } from "next/navigation";

// TODO: We should split this page into multiple subpages (profile management, invite management, etc.) but for now we will keep everything in one place to speed up development.

// TODO: We should also add some kind of notification system to notify doctor when they receive a new invitation, but for now they will have to check the "My Centers" page manually to see if they received any new invitations.

// ─── Schema ───────────────────────────────────────────────────────────────────
import {
  doctorProfileSchema,
  type DoctorProfileFormData,
  type SpecOption,
} from "@/lib/schemas/doctor";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DoctorProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profileExists, setProfileExists] = useState(false);
  const [specsList, setSpecsList] = useState<SpecOption[]>([]);

  const form = useForm<DoctorProfileFormData>({
    resolver: zodResolver(doctorProfileSchema),
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
        const [profResult, specResult] = await Promise.all([
          getProfileAction(),
          getSpecializationsAction(),
        ]);

        if (profResult.error === "Access denied.") forbidden();

        if (specResult.data) {
          setSpecsList(specResult.data);
        }

        if (profResult.data) {
          setProfileExists(true);
          form.reset({
            specializations: profResult.data.specializations ?? [],
            bio: profResult.data.bio ?? "",
            licenseNumber: profResult.data.licenseNumber ?? "",
            isPublic: profResult.data.public ?? true,
          });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [form]);

  async function onSubmit(values: DoctorProfileFormData) {
    const result = await upsertProfileAction(values);

    // POPRAWKA 3: Bezpieczniejsze sprawdzanie błędu pod TS
    if (result.error) {
      toast.error(result.error);
      return;
    }

    setProfileExists(true);
    toast.success("Profile saved successfully.");
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
                        {specsList.map((s) => {
                          const active = selected.includes(s.code);
                          return (
                            <button
                              key={s.code}
                              type="button"
                              onClick={() => toggleSpecialization(s.code)}
                              className={cn(
                                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                                active
                                  ? "border-accent bg-accent text-accent-foreground"
                                  : "border-border text-muted-foreground hover:border-accent/50 hover:text-foreground",
                              )}
                            >
                              {s.name}
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
                              (code) =>
                                specsList.find((s) => s.code === code)?.name,
                            )
                            .filter(Boolean)
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
