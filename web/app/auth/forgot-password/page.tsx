"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

import { toast } from "sonner";
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
import { GlassPanel } from "@/components/ui/glass";

import { forgotPasswordAction } from "@/lib/actions/auth";
import { forgotSchema, type ForgotFormData } from "@/lib/schemas/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: ForgotFormData) {
    const result = await forgotPasswordAction(values.email);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setIsSuccess(true);
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4">
      {/* ── ATMOSPHERIC BLOBS ── */}
      <div className="pointer-events-none absolute top-[20%] left-[20%] h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px] dark:bg-primary/10" />
      <div className="pointer-events-none absolute bottom-[20%] right-[20%] h-[600px] w-[600px] translate-x-1/4 translate-y-1/4 rounded-full bg-accent/20 blur-[120px] dark:bg-accent/15" />

      <div className="relative z-10 w-full max-w-md">
        <GlassPanel className="p-8 md:p-10">
          {isSuccess ? (
            <div className="flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 fade-in duration-500">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 ring-8 ring-accent/5">
                <CheckCircle2 size={32} className="text-accent" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Check your email
              </h2>
              <p className="text-sm text-muted-foreground">
                If an account exists for that email, we have sent password reset
                instructions.
              </p>
              <Button
                className="mt-6 w-full h-12 rounded-2xl text-base shadow-md"
                onClick={() => router.push("/auth")}
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <div className="animate-in zoom-in-95 fade-in duration-500">
              <div className="space-y-2 text-center mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Forgot Password?
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enter your email address and we'll send you a link to reset
                  your password.
                </p>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground font-semibold">
                          Email address
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                              size={18}
                            />
                            <Input
                              type="email"
                              placeholder="john.doe@example.com"
                              className="pl-11"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4 pt-2">
                    <Button
                      type="submit"
                      className="w-full h-12 rounded-2xl text-base shadow-md"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => router.push("/auth")}
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ArrowLeft size={16} className="mr-2" /> Back to Sign In
                      </button>
                    </div>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}
