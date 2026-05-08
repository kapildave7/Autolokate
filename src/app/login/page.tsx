import type { Metadata } from "next";
import { LoginPageClient } from "@/components/auth/login-page-client";
import { SITE_NAME } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: `Sign in — ${SITE_NAME}`,
  description: `Sign in to ${SITE_NAME} with a one-time code sent to your phone.`,
};

export default function LoginPage() {
  return <LoginPageClient />;
}
