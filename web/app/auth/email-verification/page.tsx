"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// TODO: Fix the email verification flow. Currently, when user clicks the verification link in the email, they are redirected to this page with the token in the URL. We should verify the token on the server and show a success or error message based on the result. Right now, we are just showing a loading state and not actually verifying the token, which is not ideal.

import { verifyEmailAction } from "@/lib/actions/auth";

function VerificationManager() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState(
    "We are verifying your email address...",
  );

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid or missing verification token.");
      return;
    }

    verifyEmailAction(token).then((result) => {
      if (result.error) {
        setStatus("error");
        setMessage(result.error);
      } else {
        setStatus("success");
        setMessage("Your email has been successfully verified.");
      }
    });
  }, [token]);

  return (
    <div className="flex w-full max-w-md flex-col items-center justify-center space-y-6 rounded-2xl border border-border bg-card p-10 text-center shadow-lg animate-in zoom-in-95 fade-in duration-500">
      {/* State: Loading */}
      {status === "loading" && (
        <>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Loader2 size={40} className="animate-spin text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Verifying...
            </h2>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </>
      )}

      {/* State: Success */}
      {status === "success" && (
        <>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 ring-8 ring-accent/5">
            <CheckCircle2 size={40} className="text-accent" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Email Verified!
            </h2>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          <Button
            className="mt-4 w-full h-11 text-base"
            onClick={() => router.push("/auth")}
          >
            Go to Sign In
          </Button>
        </>
      )}

      {/* State: Error */}
      {status === "error" && (
        <>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 ring-8 ring-destructive/5">
            <XCircle size={40} className="text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Verification Failed
            </h2>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          <Button
            variant="outline"
            className="mt-4 w-full h-11 text-base"
            onClick={() => router.push("/auth")}
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Sign In
          </Button>
        </>
      )}
    </div>
  );
}

// Główny komponent strony
export default function EmailVerificationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Suspense zapobiega błędom dehydracji podczas budowania aplikacji w Next.js */}
      <Suspense
        fallback={<Loader2 className="animate-spin text-muted-foreground" />}
      >
        <VerificationManager />
      </Suspense>
    </div>
  );
}
