"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import api from "@/lib/api";

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

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: LoginFormData) {
    setServerError(null);
    try {
      const { data } = await api.post("/auth/login", values);

      if (data.status === "PENDING") {
        setServerError("Your account is awaiting admin verification.");
        return;
      }
      if (data.status === "BANNED") {
        setServerError(
          "Your account has been suspended. Please contact support.",
        );
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Invalid email or password.";
      setServerError(message);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                    autoComplete="email"
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
              <div className="flex items-center justify-between">
                <FormLabel className="text-muted-foreground">
                  Password
                </FormLabel>
                {/* Placeholder for future forgot password feature */}
                <a
                  href="#"
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <FormControl>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={18}
                  />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
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

        {serverError && (
          <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {serverError}
          </p>
        )}

        <Button
          type="submit"
          className="w-full h-11 text-base shadow-sm mt-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </Form>
  );
}
