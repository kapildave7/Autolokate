"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  Globe,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { createDealerReview, getDealerDetails } from "@/lib/client/dealer-api";
import { hasAuthTokens } from "@/lib/client/auth-storage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { partnerMonogram } from "@/lib/utils";
import type { DealerDetailPayload } from "@/lib/dealers/dealer-types";

type Props = {
  dealerId: string;
  initialData?: DealerDetailPayload | null;
};

function formatWhen(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString("en-IN", { dateStyle: "medium" }) : "";
}

export function DealerDetailView({ dealerId, initialData }: Props) {
  const qc = useQueryClient();
  const loggedIn = hasAuthTokens();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["dealer-detail", dealerId],
    queryFn: () => getDealerDetails(dealerId),
    initialData: initialData ?? undefined,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: () => createDealerReview(dealerId, { rating, review_text: text.trim() }),
    onSuccess: async () => {
      toast.success("Review submitted.");
      setText("");
      await qc.invalidateQueries({ queryKey: ["dealer-detail", dealerId] });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Could not submit review.");
    },
  });

  if (isPending && !data) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading dealer…</p>
      </div>
    );
  }

  if (isError || !data?.dealer) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Dealer not found or unavailable."}
        </p>
        <Button className="mt-6" variant="outline" asChild>
          <Link href="/companies">Back to dealers</Link>
        </Button>
      </div>
    );
  }

  const { dealer, reviews } = data;
  const mono = partnerMonogram(dealer.name);
  const ratingDisplay = dealer.rating != null && Number.isFinite(dealer.rating) ? dealer.rating.toFixed(1) : "—";
  const reviewCount = dealer.review_count ?? reviews.length;

  return (
    <div>
      <div className="relative h-56 w-full overflow-hidden sm:h-72 lg:h-96">
        <div
          className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-900"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white text-xl font-black tracking-tight text-primary shadow-lg ring-1 ring-black/10">
              {mono}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{dealer.name}</h1>
                {dealer.is_verified ? (
                  <Badge className="gap-1 border border-primary/30 bg-primary/10 text-primary">
                    <ShieldCheck className="h-3 w-3" />
                    Verified partner
                  </Badge>
                ) : null}
                {dealer.partner_type ? (
                  <Badge variant="secondary" className="capitalize">
                    {dealer.partner_type.replace(/_/g, " ")}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {dealer.address ?? "Address on file"}
                {dealer.city_id ? ` · City ref: ${dealer.city_id.slice(0, 8)}…` : null}
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-brand-yellow-mid backdrop-blur">
                  <Star className="h-3.5 w-3.5 fill-brand-yellow-mid" />
                  {ratingDisplay}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-white/90 backdrop-blur">
                  {reviewCount} review{reviewCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="mb-8 h-auto w-full flex-wrap justify-start gap-1 bg-secondary/40 p-2">
            <TabsTrigger value="about" className="gap-2">
              <Building2 className="h-4 w-4" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <Star className="h-4 w-4" />
              Reviews ({reviews.length})
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2">
              Inventory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-0 space-y-6">
            <Card className="border-border bg-card/60">
              <CardContent className="space-y-4 p-6">
                <h2 className="text-lg font-semibold text-foreground">Reach this dealer</h2>
                <div className="flex gap-3 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{dealer.address ?? "—"}</span>
                </div>
                {dealer.phone ? (
                  <div className="flex gap-3 text-sm text-muted-foreground">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <a href={`tel:${dealer.phone}`} className="text-foreground hover:underline">
                      {dealer.phone}
                    </a>
                  </div>
                ) : null}
                {dealer.email ? (
                  <div className="flex gap-3 text-sm text-muted-foreground">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <a href={`mailto:${dealer.email}`} className="text-foreground hover:underline">
                      {dealer.email}
                    </a>
                  </div>
                ) : null}
                {dealer.website ? (
                  <div className="flex gap-3 text-sm text-muted-foreground">
                    <Globe className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <a href={dealer.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Website
                    </a>
                  </div>
                ) : null}
                <Button className="w-full max-w-sm gap-2" type="button" asChild>
                  <Link href="/chat">
                    <MessageCircle className="h-4 w-4" />
                    Chat on platform
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-0 space-y-6">
            <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Reviews</h2>
                <div className="space-y-3">
                  {reviews.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                      No reviews yet.
                    </p>
                  ) : (
                    reviews.map((r) => (
                      <Card key={r.id} className="border-border bg-card/50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Verified buyer</span>
                            <span className="text-brand-yellow-mid">
                              ★ {r.rating != null ? r.rating : "—"}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-foreground">{r.review_text ?? "—"}</p>
                          <p className="mt-2 text-xs text-muted-foreground">{formatWhen(r.created_at)}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
              <Card className="h-fit border-border bg-card/60 lg:sticky lg:top-24">
                <CardContent className="space-y-4 p-6">
                  <h3 className="text-sm font-semibold text-foreground">Write a review</h3>
                  {!loggedIn ? (
                    <p className="text-sm text-muted-foreground">
                      <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                        Sign in
                      </Link>{" "}
                      to submit a review (one per dealer).
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {([1, 2, 3, 4, 5] as const).map((n) => (
                          <Button
                            key={n}
                            type="button"
                            size="sm"
                            variant={rating === n ? "default" : "outline"}
                            className={rating === n ? "bg-[#14532d] hover:bg-[#14532d]/90" : ""}
                            onClick={() => setRating(n)}
                          >
                            {n}★
                          </Button>
                        ))}
                      </div>
                      <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Share your experience…"
                        className="min-h-[120px]"
                      />
                      <Button
                        type="button"
                        className="w-full"
                        disabled={text.trim().length < 4 || mutation.isPending}
                        onClick={() => mutation.mutate()}
                      >
                        {mutation.isPending ? "Submitting…" : "Submit review"}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="mt-0">
            <Card className="border-border bg-card/60">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">
                  Live listings are in the main catalogue. Browse cars and filter by city — dealer assignment on listings
                  will appear here as inventory APIs roll out.
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/cars">Browse all cars</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
