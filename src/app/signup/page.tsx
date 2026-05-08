import type { Metadata } from "next";
import { SignupPageClient } from "@/components/auth/signup-page-client";
import { SITE_NAME } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Sign up — ${SITE_NAME}`,
  description: `Create your ${SITE_NAME} account with mobile OTP verification.`,
};

export default function SignupPage() {
  return <SignupPageClient />;
}
