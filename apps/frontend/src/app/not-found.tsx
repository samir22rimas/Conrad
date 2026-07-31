"use client";

import Link from "next/link";
import { Terminal, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex flex-col justify-center items-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight">404 - Page Not Found</h1>
      <p className="text-muted-foreground mt-3 max-w-md leading-relaxed">
        The coding workspace or roadmap lesson you are looking for does not exist or has been moved. Let's redirect you back to safety.
      </p>
      <div className="flex gap-4 mt-8">
        <Link href="/dashboard" className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          Dashboard
        </Link>
        <Link href="/" className="px-6 py-2.5 border border-border rounded-xl font-medium hover:bg-muted transition">
          Go Home
        </Link>
      </div>
    </main>
  );
}
