import Link from "next/link";
import { SearchX, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
        <SearchX size={40} className="text-accent" />
      </div>

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
        Page Not Found (404)
      </h1>

      <p className="mt-4 max-w-md text-sm text-muted-foreground">
        Oops! It looks like we got lost in cyberspace. The page you are looking
        for does not exist or has been moved.
      </p>

      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Home
        </Link>

        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center justify-center rounded-md bg-accent px-6 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-dark"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
