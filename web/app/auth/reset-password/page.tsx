"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";

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

import { resetPasswordAction } from "@/lib/actions/auth";
import { resetSchema, type ResetFormData } from "@/lib/schemas/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const { isSubmitting } = form.formState;

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-xl font-bold text-destructive">Invalid Link</h2>
        <p className="text-sm text-muted-foreground">
          This password reset link is invalid or missing a token.
        </p>
        <Button onClick={() => router.push("/auth")} variant="outline">
          Back to Sign In
        </Button>
      </div>
    );
  }

  async function onSubmit(values: ResetFormData) {
    setServerError(null);
    if (!token) {
      setServerError(
        "Missing reset token. Please use the link from your email.",
      );
      return;
    }
    const result = await resetPasswordAction(token, values.newPassword);

    if (result.error) {
      setServerError(result.error);
      return;
    }

    setIsSuccess(true);
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 ring-8 ring-accent/5">
          <CheckCircle2 size={32} className="text-accent" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Password Reset!
        </h2>
        <p className="text-sm text-muted-foreground">
          Your password has been successfully updated. You can now sign in with
          your new credentials.
        </p>
        <Button
          className="mt-4 w-full h-11"
          onClick={() => router.push("/auth")}
        >
          Go to Sign In
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Create New Password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter a new, strong password for your account.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground">
                  New Password
                </FormLabel>
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
                      onClick={() => setShowPassword((v) => !v)}
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
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground">
                  Confirm New Password
                </FormLabel>
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
                      onClick={() => setShowConfirmPassword((v) => !v)}
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

          {serverError && (
            <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            className="w-full h-11 text-base shadow-sm mt-4"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>
      </Form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg animate-in zoom-in-95 fade-in duration-500">
        <Suspense
          fallback={
            <div className="flex justify-center">
              <Loader2 className="animate-spin text-muted-foreground" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
