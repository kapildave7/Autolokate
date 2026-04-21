import * as React from "react";
import { collapseAutofocusFullSelection } from "@/lib/collapse-autofocus-selection";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, onFocus, ...props }, ref) => {
    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      onFocus?.(e);
      collapseAutofocusFullSelection(e.currentTarget);
    };

    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full resize-y rounded-xl border border-input bg-white px-3 py-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        onFocus={handleFocus}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
