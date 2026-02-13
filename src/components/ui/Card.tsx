import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-xl",
          "bg-[rgba(15,34,64,0.55)] backdrop-blur-[16px]",
          "border border-[rgba(54,112,198,0.15)]",
          "shadow-[0_4px_16px_rgba(10,22,40,0.5),0_0_0_1px_rgba(54,112,198,0.08),inset_0_1px_0_rgba(184,212,240,0.05)]",
          "transition-[border-color,box-shadow] duration-200 ease-out",
          "hover:border-[rgba(90,146,219,0.25)]",
          "hover:shadow-[0_8px_32px_rgba(10,22,40,0.6),0_0_0_1px_rgba(54,112,198,0.12),inset_0_1px_0_rgba(184,212,240,0.08)]",
          className
        )}
        {...props}
      >
        {/* Inner pearl sheen — top edge highlight */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-[rgba(184,212,240,0.04)] to-transparent"
          aria-hidden="true"
        />
        {/* Content sits above the sheen */}
        <div className="relative">{props.children}</div>
      </div>
    );
  }
);

Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
      />
    );
  }
);

CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn(
        "font-display text-2xl font-semibold leading-none tracking-tight text-sapphire-100",
        className
      )}
      {...props}
    />
  );
});

CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-sapphire-400", className)}
      {...props}
    />
  );
});

CardDescription.displayName = "CardDescription";

const CardContent = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />;
  }
);

CardContent.displayName = "CardContent";

const CardFooter = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0", className)}
        {...props}
      />
    );
  }
);

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
