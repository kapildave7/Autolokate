/** Official channel — all on-site video embeds must use this channel only. */
export const INDIAN_DRIVE_GUIDE_CHANNEL_URL = "https://www.youtube.com/@IndianDriveGuide";

/** Founder profile — official portrait (Linktree CDN). */
export const IDG_FOUNDER = {
  name: "Deepak Chaudhary",
  title: "Founder, Indian Drive Guide",
  avatarUrl:
    "https://ugc.production.linktr.ee/c4d10976-7b24-485c-b142-09a888624c36_IMG-0541.png?io=true&size=avatar-v3_0",
  bio: "Deepak built Indian Drive Guide to give Indian buyers straight talk on real roads — maintenance, safety, and what actually matters when you choose a car. His videos are a practical companion to research and shortlisting.",
} as const;

/**
 * Curated IDs verified from Indian Drive Guide (driving & safety in India).
 * Replace or extend as you publish new flagship clips.
 */
export const IDG_HOME_VIDEOS = {
  /** Full-width “Inside drive guide” hero band */
  driveGuideFeature: "qLdtkb8wwv4",
  /** Small clip — driving / safety angle */
  clipSafetyA: "vOfJsbR5gzM",
  /** Small clip — maintenance / precautions */
  clipSafetyB: "vVTzstSHmZA",
} as const;

/** Editorial copy for full-width IDG sections (home, listing pages). */
export const IDG_FEATURE_COPY = {
  title: "Indian Drive Guide — real-world driving in India",
  description:
    "Walkthroughs, road-safety explainers, maintenance checks, and everyday driving judgement — filmed for Indian roads and traffic. Every embed on Autolokate comes from the official Indian Drive Guide channel so you get consistent, practical context before you shortlist or book a test drive.",
  shortLine:
    "Practical video from Indian roads — safety, upkeep, and how cars behave where you actually drive.",
} as const;

export function youtubeNocookieEmbedSrc(
  videoId: string,
  opts: { autoplay: boolean; controls?: 0 | 1 }
) {
  const q = new URLSearchParams({
    mute: "1",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    iv_load_policy: "3",
  });
  if (opts.controls === 0) q.set("controls", "0");
  if (opts.autoplay) q.set("autoplay", "1");
  return `https://www.youtube-nocookie.com/embed/${videoId}?${q.toString()}`;
}
