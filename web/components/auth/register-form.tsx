"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Loader2,
  Upload,
  FileText,
  X,
  CheckCircle2,
  User,
  Stethoscope,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Safely typed API response to fix TS errors
interface ApiResponse {
  ok?: boolean;
  status?: string | number;
  message?: string;
}

const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().min(1, "Last name is required").max(50),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["USER", "DOCTOR"], {
      required_error: "Please select an account type",
    }),
    document: z.any().optional(),
  })
  .refine(
    (data) =>
      data.role !== "DOCTOR" ||
      (data.document && (data.document as FileList).length > 0),
    {
      message: "Medical license or certification is required for doctors",
      path: ["document"],
    },
  );

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "USER",
    },
  });

  const { isSubmitting } = form.formState;
  const role = form.watch("role");

  // Step navigation logic
  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      // Validate only Step 2 fields before proceeding
      const isValid = await form.trigger([
        "firstName",
        "lastName",
        "email",
        "password",
      ]);
      if (isValid) {
        if (role === "DOCTOR") {
          setStep(3); // Doctors go to document upload
        } else {
          form.handleSubmit(onSubmit)(); // Patients submit directly
        }
      }
    }
  };

  const handleBack = () => {
    setServerError(null);
    setStep((prev) => prev - 1);
  };

  async function onSubmit(values: RegisterFormData) {
    setServerError(null);
    setPendingMessage(null);

    const formData = new FormData();
    formData.append("firstName", values.firstName);
    formData.append("lastName", values.lastName);
    formData.append("email", values.email);
    formData.append("password", values.password);
    formData.append("role", values.role);
    if (selectedFile) formData.append("document", selectedFile);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      });

      const data: ApiResponse = await response.json().catch(() => ({}));

      if (!response.ok) {
        setServerError(
          data.message ?? "Registration failed. Please try again.",
        );
        return;
      }

      if (data.status === "PENDING") {
        setPendingMessage(
          data.message ?? "Your account is pending admin verification.",
        );
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setServerError(
        "Unable to connect to the server. Please try again later.",
      );
    }
  }

  // Success State for Doctors
  if (pendingMessage) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 ring-8 ring-accent/5">
          <CheckCircle2 size={32} className="text-accent" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">
            Application Submitted
          </h3>
          <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
            {pendingMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* STEP 1: Role Selection */}
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                How will you use ClearBook?
              </h3>
              <p className="text-sm text-muted-foreground">
                Select the account type that fits your needs.
              </p>
            </div>

            <FormField
              control={form.control}
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
                            field.value === "USER"
                              ? "bg-accent/20"
                              : "bg-muted",
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
                            field.value === "DOCTOR"
                              ? "bg-accent/20"
                              : "bg-muted",
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

            <Button
              type="button"
              onClick={handleNext}
              className="w-full h-11 text-base"
            >
              Continue <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        )}

        {/* STEP 2: Basic Information */}
        {step === 2 && (
          <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">
                      First name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John"
                        autoComplete="given-name"
                        className="h-11 bg-muted/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">
                      Last name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Doe"
                        autoComplete="family-name"
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
              control={form.control}
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">
                    Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        size={18}
                      />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        className="pl-10 pr-10 h-11 bg-muted/20"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
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

            {serverError && (
              <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {serverError}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="h-11 px-4"
              >
                <ArrowLeft size={18} />
              </Button>
              <Button
                type="button"
                onClick={handleNext}
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
        )}

        {/* STEP 3: Doctor Document Upload */}
        {step === 3 && role === "DOCTOR" && (
          <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Verify your license
              </h3>
              <p className="text-sm text-muted-foreground">
                Please upload your medical certification to proceed.
              </p>
            </div>

            <FormField
              control={form.control}
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
                          <FileText
                            size={20}
                            className="shrink-0 text-accent"
                          />
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
                onClick={handleBack}
                className="h-11 px-4"
                disabled={isSubmitting}
              >
                <ArrowLeft size={18} />
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
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
        )}
      </form>
    </Form>
  );
}
