"use client";

import Image from "next/image";

type Props = {
  fieldKey?: string;
  value: unknown;
};

type InternalProps = {
  fieldKey?: string;
  value: unknown;
  depth: number;
};

function asUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : null;
}

function isImageField(key?: string): boolean {
  if (!key) return false;
  return /(image|thumbnail|hero|banner|logo|icon|avatar|cover|og_image)/i.test(key);
}

function isLikelyImageUrl(url: string): boolean {
  return /\.(png|jpe?g|webp|gif|svg|avif)(\?.*)?$/i.test(url);
}

function InternalValueRenderer({ fieldKey, value, depth }: InternalProps) {
  if (value == null || value === "") return <>{"—"}</>;

  if (Array.isArray(value)) {
    const imageUrls = value.map(asUrl).filter((url): url is string => Boolean(url && (isLikelyImageUrl(url) || isImageField(fieldKey))));
    if (imageUrls.length > 0) {
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {imageUrls.map((url) => (
            <Image
              key={url}
              src={url}
              alt={fieldKey ?? "image"}
              width={320}
              height={192}
              className="h-24 w-full rounded-md border border-purple-100 object-cover"
            />
          ))}
        </div>
      );
    }

    if (value.every((item) => item == null || ["string", "number", "boolean"].includes(typeof item))) {
      return <>{value.map((item) => String(item ?? "—")).join(", ") || "—"}</>;
    }

    if (depth >= 2) return <>{JSON.stringify(value)}</>;

    return (
      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={`${fieldKey ?? "item"}-${index}`} className="rounded-md border border-purple-100 bg-purple-50/30 p-2">
            <p className="mb-1 text-xs font-medium text-purple-700">Item {index + 1}</p>
            <InternalValueRenderer fieldKey={fieldKey} value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  const url = asUrl(value);
  if (url && (isImageField(fieldKey) || isLikelyImageUrl(url))) {
    return <Image src={url} alt={fieldKey ?? "image"} width={160} height={96} className="h-24 w-40 rounded-md border border-purple-100 object-cover" />;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (!entries.length) return <>{"—"}</>;
    if (depth >= 2) return <>{JSON.stringify(value)}</>;

    return (
      <div className="overflow-hidden rounded-md border border-purple-100 bg-white">
        <table className="w-full text-left">
          <tbody>
            {entries.map(([nestedKey, nestedValue]) => (
              <tr key={nestedKey} className="border-t border-purple-100 first:border-t-0">
                <td className="w-1/3 px-2 py-1.5 align-top text-xs font-medium text-zinc-700">{nestedKey}</td>
                <td className="px-2 py-1.5 text-xs text-zinc-700">
                  <InternalValueRenderer fieldKey={nestedKey} value={nestedValue} depth={depth + 1} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <>{String(value)}</>;
}

export function AdminValueRenderer({ fieldKey, value }: Props) {
  return <InternalValueRenderer fieldKey={fieldKey} value={value} depth={0} />;
}
