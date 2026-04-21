"use client";

import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="India-first flows: mobile OTP next step (UI only)."
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="Your name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Mobile</Label>
          <Input id="phone" type="tel" placeholder="+91 · · · · · · · · · ·" />
        </div>
        <Button type="submit" className="w-full" asChild>
          <Link href="/login">Send OTP</Link>
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
