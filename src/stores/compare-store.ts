import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX = 3;

function cleanupListingMap(variantIds: string[], listingToVariant: Record<string, string>): Record<string, string> {
  const set = new Set(variantIds);
  const next = { ...listingToVariant };
  for (const [k, v] of Object.entries(next)) {
    if (!set.has(v)) delete next[k];
  }
  return next;
}

export type CompareState = {
  /** Catalogue variant UUIDs for `/v1/catalogue/compare`. Max 3. */
  variantIds: string[];
  /** Inventory listing id → resolved variant id (for “in compare” on listing cards). */
  listingToVariant: Record<string, string>;
  addVariant: (variantId: string, opts?: { listingCarId?: string }) => boolean;
  removeVariant: (variantId: string) => void;
  removeByListingId: (listingCarId: string) => void;
  toggleVariant: (variantId: string, opts?: { listingCarId?: string }) => boolean;
  clear: () => void;
  setVariantIds: (ids: string[]) => void;
  hasVariant: (variantId: string) => boolean;
  hasListing: (listingCarId: string) => boolean;
};

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      variantIds: [],
      listingToVariant: {},

      setVariantIds: (ids) =>
        set((s) => ({
          variantIds: ids.filter(Boolean).slice(0, MAX),
          listingToVariant: cleanupListingMap(ids.filter(Boolean).slice(0, MAX), s.listingToVariant),
        })),

      addVariant: (variantId, opts) => {
        const id = variantId.trim();
        if (!id) return false;
        const { variantIds, listingToVariant } = get();
        if (variantIds.includes(id)) {
          if (opts?.listingCarId) {
            set({ listingToVariant: { ...listingToVariant, [opts.listingCarId]: id } });
          }
          return true;
        }
        if (variantIds.length >= MAX) return false;
        const nextIds = [...variantIds, id];
        const nextMap = opts?.listingCarId ? { ...listingToVariant, [opts.listingCarId]: id } : listingToVariant;
        set({ variantIds: nextIds, listingToVariant: nextMap });
        return true;
      },

      removeVariant: (variantId) => {
        const { variantIds, listingToVariant } = get();
        const nextIds = variantIds.filter((x) => x !== variantId);
        set({
          variantIds: nextIds,
          listingToVariant: cleanupListingMap(nextIds, listingToVariant),
        });
      },

      removeByListingId: (listingCarId) => {
        const v = get().listingToVariant[listingCarId];
        if (!v) return;
        get().removeVariant(v);
      },

      toggleVariant: (variantId, opts) => {
        if (get().hasVariant(variantId)) {
          get().removeVariant(variantId);
          return true;
        }
        return get().addVariant(variantId, opts);
      },

      clear: () => set({ variantIds: [], listingToVariant: {} }),

      hasVariant: (variantId) => get().variantIds.includes(variantId),

      hasListing: (listingCarId) => {
        const v = get().listingToVariant[listingCarId];
        return Boolean(v && get().variantIds.includes(v));
      },
    }),
    {
      name: "autolokate-compare-tray-v2",
      partialize: (s) => ({ variantIds: s.variantIds, listingToVariant: s.listingToVariant }),
      version: 1,
    }
  )
);
