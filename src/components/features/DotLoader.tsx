import { cn } from "@/lib/utils";
import { DotLoaderProps } from "@/types";

const DELAYS = [0, 150, 300];

export function DotLoader({ className }: DotLoaderProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="flex items-center gap-2">
        {DELAYS.map((delay, i) => (
          <div
            key={i}
            data-testid="dot"
            className="h-2 w-2 rounded-full bg-sapphire-400 animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
      <p className="text-xs text-sapphire-500 font-medium">Analyzing&hellip;</p>
    </div>
  );
}
