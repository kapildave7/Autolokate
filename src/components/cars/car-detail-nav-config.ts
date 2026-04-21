/** Sticky section anchors — order matches scroll order on the model page. */
export const CAR_DETAIL_NAV = [
  { id: "overview", label: "Overview" },
  { id: "pricing", label: "Price" },
  { id: "variants", label: "Variants" },
  { id: "specs", label: "Specs" },
  { id: "mileage", label: "Mileage" },
  { id: "colours", label: "Colours" },
  { id: "features", label: "Features" },
  { id: "images", label: "Images" },
  { id: "video", label: "Videos" },
  { id: "reviews", label: "Reviews" },
  { id: "compare", label: "Compare" },
  { id: "expert", label: "Expert" },
  { id: "ai", label: "AI" },
] as const;

export type CarDetailNavId = (typeof CAR_DETAIL_NAV)[number]["id"];
