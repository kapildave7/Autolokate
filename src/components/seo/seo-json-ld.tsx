type Props = { nodes: unknown[] };

/** Renders JSON-LD script tags for search engines (safe: JSON.stringify only). */
export function SeoJsonLd({ nodes }: Props) {
  if (!nodes.length) return null;
  return (
    <>
      {nodes.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}
    </>
  );
}
