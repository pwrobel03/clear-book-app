"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";

import { Form } from "@/components/ui/form";
import {
  RoleSelectionStep,
  PersonalDetailsStep,
  DoctorVerificationStep,
} from "./register-steps"; // Import naszych kroków

interface ApiResponse {
  ok?: boolean;
  status?: string | number;
  message?: string;
}

// Eksportujemy typy, żeby register-steps.tsx mogło z nich korzystać
export const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().min(1, "Last name is required").max(50),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string({
      required_error: "Please confirm your password",
    }),
    role: z.enum(["USER", "DOCTOR"], {
      required_error: "Please select an account type",
    }),
    document: z.any().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
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

export type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "USER",
    },
  });

  const { isSubmitting } = form.formState;
  const role = form.watch("role");

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      const isValid = await form.trigger([
        "firstName",
        "lastName",
        "email",
        "password",
        "confirmPassword",
      ]);
      if (isValid) {
        if (role === "DOCTOR") {
          setStep(3);
        } else {
          form.handleSubmit(onSubmit)();
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

  // WIDOK SUKCESU (DLA LEKARZA)
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

  // GŁÓWNY WIDOK FORMULARZA
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {step === 1 && <RoleSelectionStep onNext={handleNext} />}

        {step === 2 && (
          <PersonalDetailsStep
            onNext={handleNext}
            onBack={handleBack}
            isSubmitting={isSubmitting}
            serverError={serverError}
            role={role}
          />
        )}

        {step === 3 && role === "DOCTOR" && (
          <DoctorVerificationStep
            onBack={handleBack}
            onSubmit={form.handleSubmit(onSubmit)}
            isSubmitting={isSubmitting}
            serverError={serverError}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
          />
        )}
      </form>
    </Form>
  );
}
