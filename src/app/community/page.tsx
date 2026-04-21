import type { Metadata } from "next";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import Link from "next/link";
import { PageFade } from "@/components/shared/page-fade";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Community",
  description: "Discuss models, ownership, and road trips — UI-only community feed.",
};

const posts = [
  {
    id: "1",
    author: "Aditi K.",
    initials: "AK",
    time: "2h ago",
    body:
      "Finally compared the Creta vs Seltos on Autolokate — the spec diff table made the decision obvious. Test drive next week.",
    likes: 128,
    comments: 14,
  },
  {
    id: "2",
    author: "Rahul M.",
    initials: "RM",
    time: "5h ago",
    body:
      "Anyone switched from diesel to EV for highway runs? Looking for real-world range notes, not brochure numbers.",
    likes: 89,
    comments: 32,
  },
  {
    id: "3",
    author: "Neha S.",
    initials: "NS",
    time: "1d ago",
    body:
      "Dealer meet on the platform felt low-pressure — booked a slot and got clear answers on warranty transfer.",
    likes: 56,
    comments: 9,
  },
] as const;

export default function CommunityPage() {
  return (
    <PageFade>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Community</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Conversations worth having
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Posts here are for preview — like, comment, and share stay on this device until you sign in.
        </p>

        <div className="mt-10 space-y-6">
          {posts.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {p.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{p.author}</p>
                  <p className="text-xs text-muted-foreground">{p.time}</p>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm leading-relaxed text-foreground">{p.body}</p>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2 border-t border-border pt-3">
                <Button variant="ghost" size="sm" type="button" className="text-muted-foreground">
                  <Heart className="mr-1 h-4 w-4" />
                  {p.likes}
                </Button>
                <Button variant="ghost" size="sm" type="button" className="text-muted-foreground">
                  <MessageCircle className="mr-1 h-4 w-4" />
                  {p.comments}
                </Button>
                <Button variant="ghost" size="sm" type="button" className="text-muted-foreground">
                  <Share2 className="mr-1 h-4 w-4" />
                  Share
                </Button>
                <Button variant="outline" size="sm" className="ml-auto" asChild>
                  <Link href="/compare">Open compare</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </PageFade>
  );
}
