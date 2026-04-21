"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";
import type { Car } from "@/data/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GA_CATEGORIES, trackEvent } from "@/lib/analytics";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { CarAiAssistantMarkdown } from "@/components/cars/car-ai-assistant-markdown";
import { CarAiWelcomeCelebration } from "@/components/cars/car-ai-welcome-celebration";
import { CarDetailAiAccessPaywall } from "@/components/cars/car-detail-ai-access-paywall";
import { consumeAiAccessWelcomeFlag, hasValidAiAccess } from "@/lib/client/ai-access-storage";

type Role = "user" | "assistant";

export type ChatTurn = { role: Role; content: string };

function suggestedQuestionsForCar(brand: string, model: string): string[] {
  const v = `${brand} ${model}`;
  return [
    `What is the on-road price of the ${v}?`,
    `What mileage does the ${v} give in city and highway?`,
    `What are the key features and variants available for the ${v}?`,
    `How does the ${v} compare with similar models?`,
    `What is the waiting period and delivery time for the ${v}?`,
    `Is the ${v} good for long-term reliability and maintenance?`,
    `What is the service cost and maintenance schedule for the ${v}?`,
  ];
}

export function CarDetailAiAssistant({ car }: { car: Car }) {
  const reduceMotion = useReducedMotion();
  const [hasAccess, setHasAccess] = useState(false);
  const [showAiWelcome, setShowAiWelcome] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const vehicle = `${car.brand} ${car.model}`;
  const chips = suggestedQuestionsForCar(car.brand, car.model);

  useEffect(() => {
    setHasAccess(hasValidAiAccess());
    const onChange = () => setHasAccess(hasValidAiAccess());
    window.addEventListener("autolokate-ai-access-changed", onChange);
    return () => window.removeEventListener("autolokate-ai-access-changed", onChange);
  }, []);

  useEffect(() => {
    if (!hasAccess) return;
    if (consumeAiAccessWelcomeFlag()) {
      setShowAiWelcome(true);
      trackEvent("car_ai_welcome_celebration", { event_category: GA_CATEGORIES.car_detail, car_id: car.id });
    }
  }, [hasAccess, car.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || pending || !hasAccess) return;

      const nextUser: ChatTurn = { role: "user", content: trimmed };
      const history = [...messages, nextUser];
      setMessages(history);
      setInput("");
      setPending(true);
      trackEvent("car_ai_chat_send", {
        event_category: GA_CATEGORIES.car_detail,
        car_id: car.id,
        message_length: trimmed.length,
      });

      try {
        const res = await fetch("/api/cars/ai-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ carId: car.id, messages: history, car }),
        });
        const data = (await res.json()) as {
          message?: string;
          error?: string;
          aiStatus?: number;
          aiCode?: string | null;
        };
        if (!res.ok) {
          const hint =
            data.aiStatus != null
              ? `${data.error ?? "Request failed"} (HTTP ${data.aiStatus}${data.aiCode ? ` · ${data.aiCode}` : ""})`
              : (data.error ?? "Request failed");
          throw new Error(hint);
        }
        if (!data.message) throw new Error("No answer");
        setMessages((prev) => [...prev, { role: "assistant", content: data.message! }]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Something went wrong";
        toast.error(msg);
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setPending(false);
      }
    },
    [car.id, messages, pending, hasAccess]
  );

  const locked = !hasAccess;

  if (locked) {
    return (
      <div className="relative w-full min-w-0 overflow-hidden rounded-[2rem] pb-4 pt-5 sm:rounded-[2.25rem] sm:pb-6 sm:pt-7">
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(ellipse_100%_70%_at_50%_0%,rgba(63,63,70,0.14),transparent_52%),radial-gradient(ellipse_80%_55%_at_100%_40%,rgba(82,82,91,0.1),transparent_50%),radial-gradient(ellipse_70%_50%_at_0%_90%,rgba(39,39,42,0.1),transparent_48%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-linear-to-b from-zinc-950/[0.12] via-zinc-500/[0.04] to-background dark:from-zinc-950/28 dark:via-zinc-800/10 dark:to-background"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-[0.22] mix-blend-overlay [background-image:linear-gradient(rgba(63,63,70,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(63,63,70,0.06)_1px,transparent_1px)] bg-size-[24px_24px]"
          aria-hidden
        />
        <section className="relative overflow-visible" aria-labelledby="car-ai-assistant-heading">
          <CarDetailAiAccessPaywall onUnlocked={() => setHasAccess(true)} vehicleLabel={vehicle} />
        </section>
      </div>
    );
  }

  return (
    <>
      <CarAiWelcomeCelebration
        open={showAiWelcome}
        onClose={() => setShowAiWelcome(false)}
        vehicleLabel={vehicle}
        reduceMotion={reduceMotion}
        scrollTargetId="car-ai-chat-heading"
      />
      <section
        className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md ring-1 ring-border/60 dark:rounded-3xl dark:border-border/50 dark:bg-card dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_56px_-32px_rgba(0,0,0,0.35)] dark:ring-border/40"
        aria-labelledby="car-ai-chat-heading"
      >
      <div className="flex items-center gap-2 border-b border-border/70 bg-muted/25 px-3 py-2.5 sm:px-4 dark:border-zinc-700/40 dark:bg-linear-to-r dark:from-zinc-950/40 dark:via-zinc-900/15 dark:to-transparent">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <h2 id="car-ai-chat-heading" className="min-w-0 truncate text-sm font-semibold text-foreground">
          Ask about {vehicle}
        </h2>
        <span className="ml-auto hidden shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:inline">
          Uses this listing
        </span>
      </div>

      <div className="px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Suggested</p>
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible">
          {chips.map((q) => (
            <button
              key={q}
              type="button"
              disabled={pending}
              onClick={() => send(q)}
              className={cn(
                "shrink-0 rounded-full border border-border/90 bg-secondary/50 px-3 py-1.5 text-left text-[11px] font-medium text-foreground transition",
                "hover:border-primary/30 hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
                "disabled:pointer-events-none disabled:opacity-50 sm:max-w-none sm:whitespace-normal"
              )}
            >
              {q}
            </button>
          ))}
        </div>

        <div
          ref={scrollRef}
          className="mt-3 max-h-[min(48vh,22rem)] space-y-2.5 overflow-y-auto rounded-2xl border border-border/70 bg-muted/20 p-2.5 sm:p-3 dark:border-zinc-700/30 dark:bg-muted/30 [scrollbar-width:thin]"
        >
          {messages.length === 0 && !pending ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-center">
              <MessageCircle className="h-8 w-8 text-primary/35" aria-hidden />
              <p className="text-xs font-medium text-foreground">Ask a question</p>
              <p className="max-w-[min(100%,20rem)] px-1 text-[11px] leading-relaxed text-muted-foreground sm:max-w-md">
                Tap a suggestion or type below. Replies use{" "}
                {car.companyId === "catalogue" ? "this model’s catalogue snapshot" : "this listing"} with Autolokate AI
                (OpenAI). Always confirm on-road price and availability with an authorised dealer in India.
              </p>
            </div>
          ) : null}

          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={`msg-${i}`}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className={cn("flex gap-2 sm:gap-2.5", m.role === "user" ? "flex-row-reverse" : "flex-row")}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-primary/20 bg-card text-primary shadow-sm"
                  )}
                >
                  {m.role === "user" ? (
                    <User className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Bot className="h-3.5 w-3.5" aria-hidden />
                  )}
                </span>
                <div
                  className={cn(
                    "min-w-0 max-w-[calc(100%-2.25rem)] rounded-xl px-3 py-2 text-[13px] sm:max-w-[min(100%,36rem)] sm:px-3.5 sm:py-2.5",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-foreground shadow-sm"
                  )}
                >
                  {m.role === "assistant" ? (
                    <CarAiAssistantMarkdown content={m.content} />
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed text-primary-foreground">{m.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {pending ? (
            <div className="flex gap-2 sm:gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-card text-primary sm:h-8 sm:w-8">
                <Bot className="h-3.5 w-3.5" aria-hidden />
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-primary/20 bg-card px-3 py-2 text-[13px] text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" aria-hidden />
                Thinking…
              </div>
            </div>
          ) : null}
        </div>

        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about the ${vehicle}…`}
            disabled={pending}
            rows={2}
            className="min-h-[3.5rem] resize-none border-border bg-background text-sm shadow-sm focus-visible:border-primary/35 focus-visible:ring-primary/15 sm:min-h-[2.75rem] sm:flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
          />
          <Button
            type="submit"
            disabled={pending || !input.trim()}
            className="h-10 shrink-0 gap-1.5 rounded-lg px-4 text-sm sm:h-[2.75rem]"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Send className="h-3.5 w-3.5" aria-hidden />
            )}
            Send
          </Button>
        </form>
      </div>
    </section>
    </>
  );
}
