"use client";

import type { Components } from "react-markdown";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const heading = "font-display font-bold tracking-tight text-foreground first:mt-0 scroll-mt-2";

const components: Partial<Components> = {
  h1: ({ className, ...props }) => (
    <h2 className={cn(heading, "mb-2 mt-4 text-base sm:text-lg", className)} {...props} />
  ),
  h2: ({ className, ...props }) => (
    <h3 className={cn(heading, "mb-2 mt-3.5 text-[0.95rem] sm:text-base", className)} {...props} />
  ),
  h3: ({ className, ...props }) => (
    <h4
      className={cn(
        heading,
        "mb-2 mt-3.5 border-b border-primary/15 pb-1 text-[0.8125rem] sm:text-sm",
        className
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h5 className={cn("mb-1.5 mt-3 text-sm font-semibold text-foreground first:mt-0", className)} {...props} />
  ),
  h5: ({ className, ...props }) => (
    <h6 className={cn("mb-1 mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground", className)} {...props} />
  ),
  h6: ({ className, ...props }) => (
    <h6 className={cn("mb-1 mt-2 text-xs font-medium text-muted-foreground", className)} {...props} />
  ),
  p: ({ className, ...props }) => (
    <p className={cn("mb-3 text-[13px] leading-relaxed text-muted-foreground last:mb-0 sm:text-sm", className)} {...props} />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn("mb-3 list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-muted-foreground sm:text-sm", className)}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn(
        "mb-3 list-decimal space-y-1.5 pl-5 text-[13px] leading-relaxed text-muted-foreground sm:text-sm",
        "[&>li::marker]:font-semibold [&>li::marker]:text-foreground/80",
        className
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0", className)} {...props} />
  ),
  strong: ({ className, ...props }) => (
    <strong className={cn("font-semibold text-foreground", className)} {...props} />
  ),
  em: ({ className, ...props }) => (
    <em className={cn("italic text-muted-foreground", className)} {...props} />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn("font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary", className)}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("my-4 border-0 border-t border-border/80", className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "my-3 border-l-2 border-primary/30 pl-3 text-[13px] italic text-muted-foreground sm:text-sm",
        className
      )}
      {...props}
    />
  ),
  code: ({ className, children, ...rest }) => {
    const inline = Boolean((rest as { inline?: boolean }).inline);
    return inline ? (
      <code
        className={cn(
          "rounded-md bg-muted/80 px-1.5 py-0.5 font-mono text-[0.75rem] text-foreground ring-1 ring-border/60",
          className
        )}
      >
        {children as ReactNode}
      </code>
    ) : (
      <code className={cn("block whitespace-pre-wrap font-mono text-[0.75rem] leading-relaxed", className)}>
        {children as ReactNode}
      </code>
    );
  },
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "mb-3 overflow-x-auto rounded-lg border border-border/80 bg-muted/40 p-3 text-[0.75rem] leading-relaxed",
        className
      )}
      {...props}
    />
  ),
};

export function CarAiAssistantMarkdown({ content }: { content: string }) {
  return (
    <div className="car-ai-md min-w-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
