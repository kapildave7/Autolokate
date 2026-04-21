const STORAGE_KEY = "autolokate-media-continue";

export type ContinueVideo = {
  slug: string;
  title: string;
  thumbnail: string;
};

export function saveContinueVideo(v: ContinueVideo): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  } catch {
    /* private mode / quota */
  }
}

export function readContinueVideo(): ContinueVideo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as ContinueVideo;
    if (!p?.slug || !p?.title) return null;
    return p;
  } catch {
    return null;
  }
}
