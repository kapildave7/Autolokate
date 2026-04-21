"use client";

import { apiRequest } from "@/lib/client/api-client";

export type AuthUser = {
  id?: string;
  full_name?: string | null;
  phone?: string | null;
  city_id?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  preferred_fuel_types?: string[] | null;
  preferred_body_types?: string[] | null;
  preferred_vehicle_category?: string | null;
  consented_at?: string | null;
  consent_version?: string | null;
  is_pending_deletion?: boolean;
  deletion_scheduled_at?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type RequestOtpPayload = {
  phone: string;
};

export type RequestOtpResponse = {
  sent: boolean;
  expires_in: number;
  message?: string;
};

type RequestOtpApiResponse =
  | RequestOtpResponse
  | {
      success?: boolean;
      data?: {
        message?: string;
      };
    };

export type VerifyOtpPayload = {
  phone: string;
  otp: string;
  consent_accepted: boolean;
  consent_version: string;
  full_name: string;
};

export type VerifyOtpResponse = {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
  is_new_user: boolean;
};

type VerifyOtpApiResponse =
  | VerifyOtpResponse
  | {
      success?: boolean;
      data?: VerifyOtpResponse | { user?: AuthUser; session?: { access_token?: string; refresh_token?: string; user?: AuthUser } };
    };

type MeApiResponse =
  | AuthUser
  | {
      success?: boolean;
      data?: AuthUser;
    };

export type CompleteOnboardingPayload = {
  full_name?: string;
  phone?: string;
  city_id?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  preferred_fuel_types?: string[] | null;
  preferred_body_types?: string[] | null;
  preferred_vehicle_category?: string | null;
};

export async function requestOtp(payload: RequestOtpPayload): Promise<RequestOtpResponse> {
  const response = await apiRequest<RequestOtpApiResponse>("/v1/auth/login/otp", {
    method: "POST",
    body: payload,
  });

  if ("sent" in response) {
    return {
      sent: Boolean(response.sent),
      expires_in: typeof response.expires_in === "number" ? response.expires_in : 300,
      message: response.message,
    };
  }

  return {
    sent: response.success !== false,
    expires_in: 300,
    message: response.data?.message,
  };
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponse> {
  const response = await apiRequest<VerifyOtpApiResponse>("/v1/auth/verify-otp", {
    method: "POST",
    body: payload,
  });

  if ("access_token" in response && "refresh_token" in response) {
    return response;
  }
  if (response.data && "access_token" in response.data && "refresh_token" in response.data) {
    return response.data;
  }
  if (
    response.data &&
    "session" in response.data &&
    response.data.session?.access_token &&
    response.data.session?.refresh_token
  ) {
    return {
      access_token: response.data.session.access_token,
      refresh_token: response.data.session.refresh_token,
      user: response.data.user ?? response.data.session.user ?? {},
      is_new_user: false,
    };
  }
  throw new Error("Invalid verify OTP response");
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await apiRequest<MeApiResponse>("/v1/auth/me", {
    method: "GET",
    auth: true,
  });

  if ("id" in response) return response as AuthUser;
  const maybeData = (response as { data?: AuthUser }).data;
  if (maybeData && "id" in maybeData) return maybeData;
  throw new Error("Invalid profile response");
}

export function completeOnboarding(payload: CompleteOnboardingPayload) {
  return apiRequest<AuthUser>("/v1/auth/me", {
    method: "PATCH",
    auth: true,
    body: payload,
  });
}

export async function logoutUser(): Promise<void> {
  await apiRequest("/v1/auth/logout", {
    method: "POST",
    auth: true,
  });
}
