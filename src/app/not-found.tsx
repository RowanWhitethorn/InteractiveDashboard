// src/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg p-8 text-center space-y-4">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        The page you’re looking for doesn’t exist.
      </p>
      <div className="space-x-3">
        <Link href="/sign-in" prefetch={false} className="underline">Sign in</Link>
        <span className="text-muted-foreground">or</span>
        <Link href="/sign-up" prefetch={false} className="underline">Create an account</Link>
      </div>
    </main>
  );
}
