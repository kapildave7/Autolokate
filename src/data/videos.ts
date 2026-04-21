import type { MediaVideo } from "./types";
import videosJson from "./json/videos.json";

export const videos = videosJson as MediaVideo[];

export function getVideoBySlug(slug: string): MediaVideo | undefined {
  return videos.find((v) => v.slug === slug);
}
