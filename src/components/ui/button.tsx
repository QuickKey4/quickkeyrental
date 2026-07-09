import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--logo-red)]/35 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--logo-red)] text-white shadow-[0_8px_20px_rgba(232,40,46,0.22)] hover:bg-[#c92228] hover:shadow-[0_10px_24px_rgba(232,40,46,0.28)] active:bg-[#b81e24] active:shadow-[0_4px_12px_rgba(232,40,46,0.2)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:bg-destructive/95",
        outline:
          "border border-black/10 bg-white text-[var(--logo-black)] shadow-sm hover:border-black/15 hover:bg-black/[0.03] active:bg-black/[0.05]",
        secondary:
          "border border-black/10 bg-white text-[var(--logo-black)] shadow-sm hover:border-black/15 hover:bg-black/[0.03] active:bg-black/[0.05]",
        ghost: "text-muted-foreground hover:bg-black/[0.04] hover:text-foreground active:bg-black/[0.06]",
        link: "text-[var(--logo-red)] underline-offset-4 hover:underline",
        danger:
          "border border-red-200 bg-white text-red-700 shadow-sm hover:border-red-300 hover:bg-red-50 active:bg-red-100/80",
      },
      size: {
        default: "h-11 min-h-[44px] px-5",
        sm: "h-9 min-h-[36px] rounded-lg px-3.5 text-xs",
        lg: "h-12 min-h-[48px] px-6 text-base",
        icon: "size-11 min-h-[44px] min-w-[44px] p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
