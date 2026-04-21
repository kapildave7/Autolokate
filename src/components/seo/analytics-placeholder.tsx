/**
 * Placeholders for Google Analytics 4 and Search Console verification.
 * Replace NEXT_PUBLIC_GA_MEASUREMENT_ID and add verification meta in layout when going live.
 */
export function AnalyticsPlaceholder() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!gaId) return null;
  const debug = process.env.NEXT_PUBLIC_GA_DEBUG === "true";
  const config = debug
    ? `{ anonymize_ip: true, debug_mode: true }`
    : `{ anonymize_ip: true }`;
  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', ${config});
          `,
        }}
      />
    </>
  );
}
