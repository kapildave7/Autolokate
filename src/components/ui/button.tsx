import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 active:scale-[0.98] motion-reduce:active:scale-100",
  {
    variants: {
      variant: {
        /** Default = bright blue pill (matches autolokate.com "Try Demo" / "Buy Now"). */
        default:
          "border border-transparent bg-primary text-primary-foreground shadow-[0_6px_20px_-6px_rgba(37,99,235,0.55)] hover:bg-[color:var(--cta-hover)] hover:shadow-[0_10px_28px_-8px_rgba(37,99,235,0.65)]",
        primary:
          "border border-transparent bg-primary text-primary-foreground shadow-[0_6px_20px_-6px_rgba(37,99,235,0.55)] hover:bg-[color:var(--cta-hover)] hover:shadow-[0_10px_28px_-8px_rgba(37,99,235,0.65)]",
        destructive:
          "border border-transparent bg-destructive text-white shadow-sm hover:bg-[#dc2626]",
        /** Outline = transparent pill with a soft border (matches "See how it works"). */
        outline:
          "border border-border bg-transparent text-foreground hover:bg-muted/60 hover:border-primary/50 hover:text-foreground",
        secondary:
          "border border-border bg-card text-foreground hover:bg-muted/60",
        ghost: "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        glass:
          "border border-border bg-card/70 text-foreground backdrop-blur-md hover:bg-card hover:border-primary/40",
        cta:
          "border border-transparent bg-primary text-primary-foreground shadow-[0_6px_20px_-6px_rgba(37,99,235,0.55)] hover:bg-[color:var(--cta-hover)] hover:shadow-[0_10px_28px_-8px_rgba(37,99,235,0.65)] focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        /** Listing grids (catalogue + inventory) — soft surface, not the bright blue `cta`. */
        listing:
          "rounded-lg border border-border bg-muted/40 font-semibold text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.25)] hover:bg-muted/70 hover:border-primary/40 hover:shadow-md active:bg-muted/85",
        /** Expert / book-expert flows — emerald CTA (isolated from site-wide blue `cta`). */
        expert:
          "border border-transparent bg-linear-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-950/35 hover:from-emerald-500 hover:to-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-7 text-sm",
        icon: "h-9 w-9 rounded-full p-0",
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
