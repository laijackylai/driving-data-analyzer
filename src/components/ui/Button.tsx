import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium font-body transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sapphire-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-sapphire-950 disabled:pointer-events-none disabled:opacity-40",
          {
            // Sapphire primary
            "bg-sapphire-600 text-sapphire-50 hover:bg-sapphire-500 shadow-[0_1px_3px_rgba(10,22,40,0.4),inset_0_1px_0_rgba(184,212,240,0.1)] hover:shadow-[0_4px_12px_rgba(54,112,198,0.3),inset_0_1px_0_rgba(184,212,240,0.15)]":
              variant === "primary",
            // Secondary — subtle glass
            "bg-sapphire-800/60 text-sapphire-200 border border-sapphire-700/40 hover:bg-sapphire-700/60 hover:text-sapphire-100 hover:border-sapphire-600/40":
              variant === "secondary",
            // Outline — glass border
            "border border-[rgba(54,112,198,0.25)] bg-transparent text-sapphire-300 hover:bg-sapphire-800/40 hover:text-sapphire-100 hover:border-[rgba(90,146,219,0.35)]":
              variant === "outline",
            // Ghost
            "text-sapphire-400 hover:bg-sapphire-800/40 hover:text-sapphire-200":
              variant === "ghost",
            // Red accent
            "bg-accent-red-600 text-white hover:bg-accent-red-500 shadow-[0_1px_3px_rgba(10,22,40,0.4),0_0_12px_rgba(248,113,113,0.15)] hover:shadow-[0_4px_16px_rgba(248,113,113,0.25),0_0_20px_rgba(248,113,113,0.1)]":
              variant === "accent",
          },
          {
            "h-9 min-h-[44px] px-3 text-sm gap-1.5": size === "sm",
            "h-11 min-h-[44px] px-4 py-2 gap-2": size === "md",
            "h-12 min-h-[48px] px-6 text-lg gap-2.5": size === "lg",
          },
          "active:scale-[0.97] active:transition-transform",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
