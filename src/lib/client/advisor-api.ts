"use client";

import { apiRequest } from "@/lib/client/api-client";

export type AdvisorOption = {
  id: string;
  label: string;
  icon?: string;
  metadata?: Record<string, unknown>;
};

export type AdvisorStep = {
  step_id: string;
  order: number;
  question: string;
  multi_select: boolean;
  options: AdvisorOption[];
};

export type AdvisorConversation = {
  id: string;
  user_id: string;
  vehicle_category: string;
  title: string;
  summary: string | null;
  status: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  current_step: number;
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  meta?: Record<string, unknown>;
};

type ListConversationsResponse = ApiEnvelope<AdvisorConversation[]>;
type CreateConversationResponse = ApiEnvelope<AdvisorConversation & { next_step?: AdvisorStep }>;
type ConversationDetailResponse = ApiEnvelope<{
  conversation: AdvisorConversation;
  messages: unknown[];
  answers: Array<{ step_id: string; selected_option_ids: string[] }>;
  next_cursor: string | null;
}>;
type CurrentStepResponse = ApiEnvelope<{
  step?: AdvisorStep;
  completed: boolean;
  current_step: number;
  answers: Array<{ step_id: string; selected_option_ids: string[] }>;
}>;
type SubmitAnswerResponse = ApiEnvelope<{
  next_step?: AdvisorStep;
  completed: boolean;
}>;
type ResultsResponse = ApiEnvelope<unknown>;
type AdvisorActionResponse = ApiEnvelope<unknown>;

export async function listAdvisorConversations(limit = 20): Promise<AdvisorConversation[]> {
  const res = await apiRequest<ListConversationsResponse>(`/v1/advisor/conversations?limit=${limit}`, {
    method: "GET",
    auth: true,
  });
  return Array.isArray(res.data) ? res.data : [];
}

export async function archiveAdvisorConversation(conversationId: string): Promise<void> {
  await apiRequest(`/v1/advisor/conversations/${conversationId}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function createAdvisorConversation(input: { vehicle_category: string; title: string }) {
  const res = await apiRequest<CreateConversationResponse>("/v1/advisor/conversations", {
    method: "POST",
    auth: true,
    body: input,
  });
  if (!res.data) throw new Error("Unable to create conversation");
  return res.data;
}

export async function getAdvisorConversation(conversationId: string, limit = 20) {
  const res = await apiRequest<ConversationDetailResponse>(`/v1/advisor/conversations/${conversationId}?limit=${limit}`, {
    method: "GET",
    auth: true,
  });
  return res.data;
}

export async function getAdvisorCurrentStep(conversationId: string) {
  const res = await apiRequest<CurrentStepResponse>(`/v1/advisor/conversations/${conversationId}/steps/current`, {
    method: "GET",
    auth: true,
  });
  return res.data;
}

export async function submitAdvisorAnswer(
  conversationId: string,
  input: { step_id: string; selected_option_ids: string[] }
) {
  const res = await apiRequest<SubmitAnswerResponse>(`/v1/advisor/conversations/${conversationId}/answer`, {
    method: "POST",
    auth: true,
    body: input,
  });
  return res.data;
}

export async function getAdvisorResults(conversationId: string) {
  const res = await apiRequest<ResultsResponse>(`/v1/advisor/conversations/${conversationId}/results`, {
    method: "GET",
    auth: true,
  });
  return res.data;
}

export async function performAdvisorAction(
  conversationId: string,
  input: {
    action: "compare" | "emi";
    model_ids?: string[];
    variant_id?: string;
    tenure_months?: number;
    down_payment?: number;
  }
) {
  const res = await apiRequest<AdvisorActionResponse>(`/v1/advisor/conversations/${conversationId}/actions`, {
    method: "POST",
    auth: true,
    body: input,
  });
  return res.data;
}
