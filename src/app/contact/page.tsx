"use client";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  return (
    <AuthShell
      title="We’re here to help"
      subtitle="Partnerships, product questions, and press — this form is a preview; submissions are not sent yet."
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="org">Organization</Label>
          <Input id="org" placeholder="Company name" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" placeholder="you@company.com" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="msg">Message</Label>
          <Textarea id="msg" rows={4} placeholder="Tell us what you’re looking for — timeline, cities, volume…" />
        </div>
        <Button type="submit" className="w-full">
          Send message
        </Button>
      </form>
    </AuthShell>
  );
}
