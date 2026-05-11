"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";

import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import {
  RoleSelectionStep,
  PersonalDetailsStep,
  DoctorVerificationStep,
} from "./register-steps";

import { registerSchema, type RegisterFormData } from "@/lib/schemas/auth";
import { registerAction } from "@/lib/actions/auth";

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
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
    setStep((prev) => prev - 1);
  };

  async function onSubmit(values: RegisterFormData) {
    setPendingMessage(null);

    const result = await registerAction({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      role: values.role,
    });

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.data?.status === "PENDING") {
      toast.success("Application submitted successfully!");
      setPendingMessage("Your account is pending admin verification.");
      return;
    }

    toast.success("Account created successfully!");
    router.push("/dashboard");
    router.refresh();
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
            role={role}
          />
        )}

        {step === 3 && role === "DOCTOR" && (
          <DoctorVerificationStep
            onBack={handleBack}
            onSubmit={form.handleSubmit(onSubmit)}
            isSubmitting={isSubmitting}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
          />
        )}
      </form>
    </Form>
  );
}
