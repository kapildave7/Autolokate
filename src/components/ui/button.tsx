import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 active:scale-[0.99] motion-reduce:active:scale-100",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-foreground text-background shadow-sm hover:bg-foreground/88 hover:shadow-md",
        primary:
          "border border-primary/20 bg-primary text-primary-foreground shadow-[0_2px_10px_-2px_rgba(24,24,27,0.2)] hover:bg-primary/90 hover:shadow-[0_4px_14px_-3px_rgba(24,24,27,0.22)]",
        destructive: "bg-destructive text-white shadow-sm hover:bg-[#dc2626]",
        outline:
          "border border-border bg-card text-foreground shadow-none hover:border-border hover:bg-muted",
        secondary:
          "border border-border/90 bg-card text-foreground shadow-none hover:bg-secondary",
        ghost: "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
        link: "text-foreground underline-offset-4 hover:underline",
        glass:
          "border border-border/80 bg-card/95 text-foreground shadow-none hover:bg-muted/80 hover:border-border",
        cta:
          "border border-transparent bg-foreground text-background shadow-sm hover:bg-foreground/88 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        /** Listing grids (catalogue + inventory) — soft surface, not pitch-black `default` / `cta`. */
        listing:
          "border border-border/90 bg-muted/45 font-semibold text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:bg-muted/70 hover:border-border hover:shadow-md active:bg-muted/85 dark:border-border dark:bg-muted/25 dark:hover:bg-muted/40",
        /** Expert / book-expert flows — emerald CTA (isolated from site-wide neutral `cta`). */
        expert:
          "border border-transparent bg-linear-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-950/35 hover:from-emerald-500 hover:to-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-lg px-6 text-sm",
        icon: "h-8 w-8 rounded-lg p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
