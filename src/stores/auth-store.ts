"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  completeOnboarding,
  fetchCurrentUser,
  logoutUser,
  requestOtp,
  type CompleteOnboardingPayload,
  type RequestOtpResponse,
  type AuthUser,
  verifyOtp,
} from "@/lib/client/auth-api";
import { clearAuthTokens, writeAuthTokens } from "@/lib/client/auth-storage";

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isNewUser: boolean;
  otpPhone: string;
  otpExpiresIn: number;
  setOtpPhone: (phone: string) => void;
  requestOtpCode: (phone: string) => Promise<RequestOtpResponse>;
  verifyOtpCode: (phone: string, otp: string) => Promise<void>;
  hydrateProfile: () => Promise<void>;
  completeProfile: (payload: CompleteOnboardingPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isNewUser: false,
      otpPhone: "",
      otpExpiresIn: 300,
      setOtpPhone: (phone) => set({ otpPhone: phone }),
      requestOtpCode: async (phone) => {
        const response = await requestOtp({ phone });
        set({ otpPhone: phone, otpExpiresIn: response.expires_in });
        return response;
      },
      verifyOtpCode: async (phone, otp) => {
        const response = await verifyOtp({
          phone,
          otp,
          consent_accepted: true,
          consent_version: "v1.0",
          full_name: "Kapil Dave",
        });
        writeAuthTokens({
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
        });
        set({
          user: response.user,
          isAuthenticated: true,
          isNewUser: response.is_new_user,
          otpPhone: phone,
        });
      },
      hydrateProfile: async () => {
        try {
          const profile = await fetchCurrentUser();
          set({ user: profile, isAuthenticated: true });
        } catch {
          clearAuthTokens();
          set({ user: null, isAuthenticated: false, isNewUser: false });
        }
      },
      completeProfile: async (payload) => {
        await completeOnboarding(payload);
        const freshProfile = await fetchCurrentUser();
        set({ user: freshProfile, isAuthenticated: true, isNewUser: false });
        return freshProfile;
      },
      logout: async () => {
        try {
          await logoutUser();
        } catch {
          // Local logout still proceeds if backend revoke fails.
        }
        clearAuthTokens();
        set({
          user: null,
          isAuthenticated: false,
          isNewUser: false,
          otpPhone: "",
        });
      },
    }),
    {
      name: "autolokate-auth-store",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isNewUser: state.isNewUser,
        otpPhone: state.otpPhone,
        otpExpiresIn: state.otpExpiresIn,
      }),
    }
  )
);
