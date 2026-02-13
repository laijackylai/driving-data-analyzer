"use client";

import { cn } from "@/lib/utils";
import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  HTMLAttributes,
  ButtonHTMLAttributes,
  forwardRef,
  useCallback,
} from "react";

// ── Context ──

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue>({
  value: "",
  onValueChange: () => {},
});

function useTabsContext() {
  return useContext(TabsContext);
}

// ── Tabs Root ──

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      className,
      defaultValue,
      value: controlledValue,
      onValueChange,
      children,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const value = controlledValue ?? internalValue;

    const handleValueChange = useCallback(
      (newValue: string) => {
        setInternalValue(newValue);
        onValueChange?.(newValue);
      },
      [onValueChange]
    );

    return (
      <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
        <div ref={ref} className={cn("w-full", className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);

Tabs.displayName = "Tabs";

// ── TabsList ──

export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {}

const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, ...props }, ref) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const resolvedRef = (ref as React.RefObject<HTMLDivElement>) || scrollRef;

    return (
      <div className="relative">
        {/* Fade edges for scroll indication */}
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 z-10 bg-gradient-to-r from-sapphire-950 to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 z-10 bg-gradient-to-l from-sapphire-950 to-transparent"
          aria-hidden="true"
        />

        <div
          ref={resolvedRef}
          role="tablist"
          className={cn(
            "flex gap-1 overflow-x-auto px-1 py-1 scrollbar-none",
            "bg-sapphire-900/50 rounded-xl border border-[rgba(54,112,198,0.1)]",
            "-webkit-overflow-scrolling-touch",
            className
          )}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          {...props}
        />
      </div>
    );
  }
);

TabsList.displayName = "TabsList";

// ── TabsTrigger ──

export interface TabsTriggerProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: activeValue, onValueChange } = useTabsContext();
    const isActive = activeValue === value;
    const buttonRef = useRef<HTMLButtonElement>(null);
    const resolvedRef = (ref as React.RefObject<HTMLButtonElement>) || buttonRef;

    // Scroll active tab into view on mount and when active changes
    useEffect(() => {
      if (isActive && resolvedRef.current) {
        resolvedRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }, [isActive, resolvedRef]);

    return (
      <button
        ref={resolvedRef}
        role="tab"
        aria-selected={isActive}
        onClick={() => onValueChange(value)}
        className={cn(
          // Base — 44px min touch target for mobile
          "relative whitespace-nowrap min-h-[44px] px-4 py-2.5 rounded-lg",
          "text-sm font-medium font-body",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sapphire-500/50",
          "flex items-center gap-2",
          "active:scale-[0.96] active:transition-transform",
          isActive
            ? [
                "bg-sapphire-700/60 text-sapphire-100",
                "shadow-[0_1px_4px_rgba(10,22,40,0.4),inset_0_1px_0_rgba(184,212,240,0.06)]",
                "border border-[rgba(54,112,198,0.2)]",
              ]
            : [
                "text-sapphire-400 hover:text-sapphire-200",
                "hover:bg-sapphire-800/40",
                "border border-transparent",
              ],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TabsTrigger.displayName = "TabsTrigger";

// ── TabsContent ──

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const { value: activeValue } = useTabsContext();
    const isActive = activeValue === value;

    if (!isActive) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn("mt-6 animate-slide-fade-in", className)}
        {...props}
      />
    );
  }
);

TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
