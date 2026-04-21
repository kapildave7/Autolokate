import { CustomerPageShell } from "@/components/shared/customer-page-shell";
import type { LegalDocument } from "@/lib/legal/legal-types";

type Props = {
  doc: LegalDocument;
  eyebrow?: string;
};

export function LegalDocumentShell({ doc, eyebrow = "Legal" }: Props) {
  const effective =
    doc.effective_date &&
    (() => {
      try {
        return new Date(doc.effective_date).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      } catch {
        return doc.effective_date;
      }
    })();

  return (
    <CustomerPageShell
      eyebrow={eyebrow}
      title={doc.title}
      lead={`Version ${doc.version}${effective ? ` · Effective ${effective}` : ""}`}
      maxWidthClass="max-w-3xl"
    >
      <article className="rounded-2xl border border-border/80 bg-card/50 p-6 shadow-sm sm:p-8">
        <div className="prose prose-sm max-w-none text-foreground dark:prose-invert prose-p:leading-relaxed prose-headings:font-display">
          <div className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-foreground/95">{doc.content}</div>
        </div>
      </article>
    </CustomerPageShell>
  );
}
