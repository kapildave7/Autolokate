"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { chatThreadsSeed } from "@/data/chat-seed";
import { motion } from "framer-motion";
import { Send, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageFade } from "@/components/shared/page-fade";

const threads = chatThreadsSeed.slice(0, 25);

export function ChatView() {
  const sp = useSearchParams();
  const aiPrompt = sp.get("prompt") ?? "";
  const aiMode = sp.get("mode");
  const aiUseCase = sp.get("useCase");
  const aiBudget = sp.get("budget");
  const aiFuel = sp.get("fuel");
  const fromAi = sp.get("source") === "ai";
  const [active, setActive] = useState(threads[0]?.id ?? "");
  const [draft, setDraft] = useState(
    fromAi
      ? `Hi AI advisor, help me shortlist a ${aiMode ?? "vehicle"} for ${aiUseCase ?? "city use"} around budget ${aiBudget ?? "-"} with fuel ${aiFuel ?? "any"}. ${
          aiPrompt ? `Prompt: ${aiPrompt}` : ""
        }`
      : "",
  );
  const activeThread = threads.find((t) => t.id === active) ?? threads[0];
  const [extraByThread, setExtraByThread] = useState<Record<string, { id: string; from: "me" | "them"; text: string }[]>>(
    {}
  );

  const msgs = [...(activeThread?.messages ?? []), ...(extraByThread[active] ?? [])];

  function send() {
    const t = draft.trim();
    if (!t) return;
    setExtraByThread((prev) => ({
      ...prev,
      [active]: [...(prev[active] ?? []), { id: `local-${Date.now()}`, from: "me" as const, text: t }],
    }));
    setDraft("");
  }

  return (
    <PageFade>
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Messages</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Chat with sellers</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Pick a thread, read context, and reply — inbox preview; messages stay in this browser only.
        </p>
        {fromAi ? (
          <p className="mt-2 text-xs text-primary">
            AI context loaded from homepage assistant. Your message draft is prefilled below.
          </p>
        ) : null}
      </div>
      <div className="mx-auto flex min-h-[calc(100vh-14rem)] max-w-6xl flex-col gap-4 px-4 pb-10 sm:px-6 lg:flex-row lg:px-8">
        <Card className="flex h-[420px] w-full flex-col overflow-hidden border-border/80 glass-card lg:h-auto lg:max-w-sm">
          <div className="border-b border-border/80 bg-secondary/20 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Inbox</p>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search chats" className="pl-9" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {threads.map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => setActive(th.id)}
                className={`mb-1 w-full rounded-xl px-3 py-3 text-left transition ${
                  active === th.id ? "bg-primary/10 ring-1 ring-primary/25" : "hover:bg-secondary/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{th.name}</p>
                  <span className="text-[10px] text-muted-foreground">{th.time}</span>
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{th.last}</p>
                {th.unread > 0 ? (
                  <span className="mt-2 inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {th.unread} new
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </Card>

        <Card className="flex flex-1 flex-col overflow-hidden border-border/80 glass-card">
          <div className="border-b border-border/80 bg-secondary/15 px-4 py-4">
            <p className="text-sm font-semibold text-foreground">
              {threads.find((t) => t.id === active)?.name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Buyer ↔ seller conversation</p>
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-gradient-to-b from-transparent to-secondary/10 p-4">
            {msgs.map((m, i) => (
              <motion.div
                key={`${m.id}-${i}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                  m.from === "me"
                    ? "ml-auto bg-gradient-to-br from-zinc-800 to-zinc-950 text-zinc-50 shadow-zinc-900/25"
                    : "mr-auto border border-border/60 bg-card/90 text-foreground backdrop-blur-sm"
                }`}
              >
                {m.text}
              </motion.div>
            ))}
          </div>
          <div className="border-t border-border/80 bg-secondary/20 p-3">
            <div className="flex gap-2 rounded-2xl border border-border/60 bg-background/40 p-1.5 backdrop-blur-sm">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a reply…"
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <Button type="button" size="icon" className="h-10 w-10 shrink-0 rounded-xl" onClick={send} aria-label="Send">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </PageFade>
  );
}
