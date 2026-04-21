import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy URL: forwards to unified login + OTP on `/login`. */
export default async function AuthOtpRedirectPage({ searchParams }: Props) {
  const sp = await searchParams;
  const phone = typeof sp.phone === "string" ? sp.phone : Array.isArray(sp.phone) ? sp.phone[0] : undefined;
  const next = typeof sp.next === "string" ? sp.next : Array.isArray(sp.next) ? sp.next[0] : undefined;

  const q = new URLSearchParams();
  q.set("step", "otp");
  if (phone) q.set("phone", phone);
  if (next) q.set("next", next);

  redirect(`/login?${q.toString()}`);
}
