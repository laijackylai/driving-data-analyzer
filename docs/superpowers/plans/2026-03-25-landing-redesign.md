# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current homepage with a full-screen landing page featuring Doto brand font, icon-only upload button with full-page drag-and-drop, a Demo shortcut, and a pixelated dissolve transition into the dashboard view — all within a single route driven by React state.

**Architecture:** Single route (`/`) with three states: `LANDING → ANALYZING → DASHBOARD`. The `DashboardView` component orchestrates state transitions. New font stack: Doto (brand), Outfit (headings), Geist Sans (body), JetBrains Mono (code). A `PixelTransition` component handles the dissolve effect via a CSS grid mask. The `TimelineSlider` gains a home button that resets to landing.

**Tech Stack:** Next.js 16, React 19, TypeScript (strict), Tailwind CSS 3, Vitest + Testing Library, `next/font/google` (Doto), `geist` npm package (Geist Sans)

**Spec:** `docs/landing-redesign.md`

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                    # MODIFY — add Doto + Geist Sans fonts, update CSS vars
│   └── page.tsx                      # NO CHANGE — thin wrapper rendering DashboardView
├── components/
│   ├── features/
│   │   ├── LandingView.tsx           # CREATE — full-screen landing page
│   │   ├── DotLoader.tsx             # CREATE — 3-dot bounce loading indicator
│   │   ├── PixelTransition.tsx       # CREATE — pixel dissolve animation wrapper
│   │   ├── DashboardView.tsx         # MODIFY — state machine, full-page drop zone, home integration
│   │   ├── TimelineSlider.tsx        # MODIFY — add home button
│   │   └── FileUpload.tsx            # NO CHANGE — kept for potential reuse, landing has its own upload
├── test/
│   ├── DotLoader.test.tsx            # CREATE
│   ├── PixelTransition.test.tsx      # CREATE
│   ├── LandingView.test.tsx          # CREATE
│   ├── DashboardView.test.tsx        # CREATE
│   ├── TimelineSlider.test.tsx       # MODIFY — add home button tests
│   └── setup.ts                      # NO CHANGE
├── hooks/
│   └── useTimeRange.tsx              # NO CHANGE
└── types/
    └── index.ts                      # NO CHANGE
tailwind.config.ts                    # MODIFY — add font-brand family
```

---

### Task 1: Font Infrastructure (Doto + Geist Sans)

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`
- Create: `src/test/fonts.test.ts`

- [ ] **Step 1: Install the `geist` npm package (Geist Sans)**

Geist Sans is Vercel's proprietary font — it is NOT available via `next/font/google`. Install it:

```bash
npm install geist
```

- [ ] **Step 2: Add Doto and Geist Sans to layout.tsx**

Open `src/app/layout.tsx`. Remove `DM_Sans` import. Add Doto from Google Fonts and Geist Sans from the `geist` package:

```tsx
// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono, Doto } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const doto = Doto({
  subsets: ["latin"],
  variable: "--font-doto",
  display: "swap",
  weight: ["600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500", "600"],
});
```

Update the `<html>` className to include all four font variables:
```tsx
className={`${outfit.variable} ${GeistSans.variable} ${doto.variable} ${jetbrainsMono.variable}`}
```

**Note:** `GeistSans.variable` provides `--font-geist-sans` automatically. If `Doto` is not yet available in `next/font/google`, use `@fontsource/doto` or load via `<link>` in layout. Check at build time.

- [ ] **Step 3: Update tailwind.config.ts font families**

Add `brand` family, update `body` to use Geist Sans:

```ts
fontFamily: {
  brand: ["var(--font-doto)", "monospace"],
  display: ["var(--font-outfit)", "system-ui", "sans-serif"],
  body: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
  mono: ["var(--font-jetbrains)", "monospace"],
},
```

- [ ] **Step 4: Update globals.css body font-family**

Change the body rule from `--font-dm-sans` to `--font-geist-sans`:

```css
body {
  font-family: var(--font-geist-sans), system-ui, sans-serif;
}
```

- [ ] **Step 5: Write font config test**

```ts
// src/test/fonts.test.ts
import { describe, it, expect } from "vitest";
import tailwindConfig from "../../tailwind.config";

describe("Font configuration", () => {
  const fontFamily = tailwindConfig.theme?.extend?.fontFamily as Record<string, string[]>;

  it("defines brand font family using Doto", () => {
    expect(fontFamily.brand).toBeDefined();
    expect(fontFamily.brand[0]).toBe("var(--font-doto)");
  });

  it("defines body font family using Geist Sans", () => {
    expect(fontFamily.body).toBeDefined();
    expect(fontFamily.body[0]).toBe("var(--font-geist-sans)");
  });

  it("preserves display font family (Outfit)", () => {
    expect(fontFamily.display).toBeDefined();
    expect(fontFamily.display[0]).toBe("var(--font-outfit)");
  });

  it("preserves mono font family (JetBrains Mono)", () => {
    expect(fontFamily.mono).toBeDefined();
    expect(fontFamily.mono[0]).toBe("var(--font-jetbrains)");
  });
});
```

- [ ] **Step 6: Run font test to verify it fails**

Run: `npx vitest run src/test/fonts.test.ts`
Expected: FAIL — `brand` key not found, `body` still uses `--font-dm-sans`

- [ ] **Step 7: Verify fonts load in browser**

Run: `npm run dev`

Open browser, inspect body text — verify computed font-family shows Geist Sans. The brand font won't be visible yet (no element uses `font-brand`).

- [ ] **Step 8: Run font test to verify it passes**

Run: `npx vitest run src/test/fonts.test.ts`
Expected: 4 passed

- [ ] **Step 9: Commit**

```bash
git add src/app/layout.tsx tailwind.config.ts src/app/globals.css src/test/fonts.test.ts package.json package-lock.json
git commit -m "feat: replace DM Sans with Geist Sans, add Doto brand font"
```

---

### Task 2: DotLoader Component + Tests

**Files:**
- Create: `src/components/features/DotLoader.tsx`
- Create: `src/test/DotLoader.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/test/DotLoader.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { DotLoader } from "@/components/features/DotLoader";

describe("DotLoader", () => {
  it("renders three dots", () => {
    const { container } = render(<DotLoader />);
    const dots = container.querySelectorAll("[data-testid='dot']");
    expect(dots).toHaveLength(3);
  });

  it("renders 'Analyzing...' text", () => {
    render(<DotLoader />);
    expect(screen.getByText("Analyzing…")).toBeInTheDocument();
  });

  it("applies staggered animation delays to dots", () => {
    const { container } = render(<DotLoader />);
    const dots = container.querySelectorAll("[data-testid='dot']");
    expect(dots[0]).toHaveStyle({ animationDelay: "0ms" });
    expect(dots[1]).toHaveStyle({ animationDelay: "150ms" });
    expect(dots[2]).toHaveStyle({ animationDelay: "300ms" });
  });

  it("accepts custom className", () => {
    const { container } = render(<DotLoader className="mt-8" />);
    expect(container.firstChild).toHaveClass("mt-8");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/test/DotLoader.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement DotLoader**

```tsx
// src/components/features/DotLoader.tsx
import { cn } from "@/lib/utils";

interface DotLoaderProps {
  className?: string;
}

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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/test/DotLoader.test.tsx`
Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add src/components/features/DotLoader.tsx src/test/DotLoader.test.tsx
git commit -m "feat: add DotLoader component with staggered bounce animation"
```

---

### Task 3: PixelTransition Component + Tests

**Files:**
- Create: `src/components/features/PixelTransition.tsx`
- Create: `src/test/PixelTransition.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/test/PixelTransition.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import { PixelTransition } from "@/components/features/PixelTransition";

describe("PixelTransition", () => {
  it("renders children", () => {
    render(
      <PixelTransition active={false} onComplete={vi.fn()}>
        <p>Hello</p>
      </PixelTransition>
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("does not apply dissolve classes when inactive", () => {
    const { container } = render(
      <PixelTransition active={false} onComplete={vi.fn()}>
        <p>Hello</p>
      </PixelTransition>
    );
    const cells = container.querySelectorAll("[data-testid='pixel-cell']");
    // When inactive, no grid overlay is rendered
    expect(cells).toHaveLength(0);
  });

  it("renders pixel grid overlay when active", () => {
    const { container } = render(
      <PixelTransition active={true} onComplete={vi.fn()}>
        <p>Hello</p>
      </PixelTransition>
    );
    const cells = container.querySelectorAll("[data-testid='pixel-cell']");
    expect(cells.length).toBeGreaterThan(0);
  });

  it("calls onComplete after animation duration", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();

    render(
      <PixelTransition active={true} onComplete={onComplete}>
        <p>Hello</p>
      </PixelTransition>
    );

    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(700); // 600ms animation + 100ms buffer
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("does not call onComplete when inactive", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();

    render(
      <PixelTransition active={false} onComplete={onComplete}>
        <p>Hello</p>
      </PixelTransition>
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onComplete).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("children remain in DOM during dissolve", () => {
    render(
      <PixelTransition active={true} onComplete={vi.fn()}>
        <p>Hello</p>
      </PixelTransition>
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/test/PixelTransition.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement PixelTransition**

The pixel dissolve works by overlaying a grid of `background-color: sapphire-950` cells that start transparent and randomly become opaque, "eating away" the content underneath.

**Performance note:** Cell size is 24px (not 8px) to keep DOM node count manageable. At 1920×1080, this produces ~80×45 = 3,600 nodes — well within browser limits. The visual effect is still clearly pixelated at this size.

```tsx
// src/components/features/PixelTransition.tsx
"use client";

import { useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";

/** Default grid columns/rows for SSR or when window dimensions are unavailable */
const FALLBACK_COLS = 80;
const FALLBACK_ROWS = 45;

interface PixelTransitionProps {
  active: boolean;
  onComplete: () => void;
  children: React.ReactNode;
  /** Grid cell size in px (default 24 — balances visual fidelity vs DOM node count) */
  cellSize?: number;
  /** Total dissolve duration in ms */
  duration?: number;
  className?: string;
}

export function PixelTransition({
  active,
  onComplete,
  children,
  cellSize = 24,
  duration = 600,
  className,
}: PixelTransitionProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use window dimensions when available and > 0, otherwise fallback.
  // In jsdom, window exists but innerWidth/innerHeight are 0.
  const cols = typeof window !== "undefined" && window.innerWidth > 0
    ? Math.ceil(window.innerWidth / cellSize)
    : FALLBACK_COLS;
  const rows = typeof window !== "undefined" && window.innerHeight > 0
    ? Math.ceil(window.innerHeight / cellSize)
    : FALLBACK_ROWS;

  const cellDelays = useMemo(() => {
    const total = cols * rows;
    const delays: number[] = [];
    for (let i = 0; i < total; i++) {
      delays.push(Math.random());
    }
    return delays;
  }, [cols, rows]);

  useEffect(() => {
    if (active) {
      timerRef.current = setTimeout(() => {
        onComplete();
      }, duration + 100);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, onComplete, duration]);

  return (
    <div className={cn("relative", className)}>
      {children}
      {active && (
        <div
          className="fixed inset-0 z-[60] pointer-events-none"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
          }}
          aria-hidden="true"
        >
          {cellDelays.map((delay, i) => (
            <div
              key={i}
              data-testid="pixel-cell"
              className="bg-sapphire-950"
              style={{
                opacity: 0,
                animation: `pixel-appear ${duration * 0.4}ms ease-out forwards`,
                animationDelay: `${delay * duration * 0.6}ms`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add pixel-appear keyframe to globals.css**

Add inside the existing `@keyframes` section at the bottom of `src/app/globals.css`:

```css
@keyframes pixel-appear {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/test/PixelTransition.test.tsx`
Expected: 6 passed

- [ ] **Step 6: Commit**

```bash
git add src/components/features/PixelTransition.tsx src/test/PixelTransition.test.tsx src/app/globals.css
git commit -m "feat: add PixelTransition dissolve effect component"
```

---

### Task 4: LandingView Component + Tests

**Files:**
- Create: `src/components/features/LandingView.tsx`
- Create: `src/test/LandingView.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/test/LandingView.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { LandingView } from "@/components/features/LandingView";

// Mock fetch for demo button
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("LandingView", () => {
  const onFileSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders brand name 'OBD2Charts'", () => {
      render(<LandingView onFileSelect={onFileSelect} />);
      expect(screen.getByText("OBD2Charts")).toBeInTheDocument();
    });

    it("brand name uses font-brand class", () => {
      render(<LandingView onFileSelect={onFileSelect} />);
      const brand = screen.getByText("OBD2Charts");
      expect(brand).toHaveClass("font-brand");
    });

    it("renders logo placeholder", () => {
      render(<LandingView onFileSelect={onFileSelect} />);
      expect(screen.getByTestId("logo-placeholder")).toBeInTheDocument();
    });

    it("logo placeholder is round", () => {
      render(<LandingView onFileSelect={onFileSelect} />);
      const logo = screen.getByTestId("logo-placeholder");
      expect(logo).toHaveClass("rounded-full");
    });

    it("renders upload button with upload icon", () => {
      render(<LandingView onFileSelect={onFileSelect} />);
      expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument();
    });

    it("renders Demo button", () => {
      render(<LandingView onFileSelect={onFileSelect} />);
      expect(screen.getByRole("button", { name: /demo/i })).toBeInTheDocument();
    });

    it("renders description text mentioning categories", () => {
      render(<LandingView onFileSelect={onFileSelect} />);
      expect(screen.getByText(/engine performance/i)).toBeInTheDocument();
      expect(screen.getByText(/fuel efficiency/i)).toBeInTheDocument();
    });

    it("has a hidden file input accepting .csv", () => {
      const { container } = render(<LandingView onFileSelect={onFileSelect} />);
      const input = container.querySelector("input[type='file']");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("accept", ".csv");
    });
  });

  describe("upload button", () => {
    it("click triggers file input", async () => {
      const user = userEvent.setup();
      const { container } = render(<LandingView onFileSelect={onFileSelect} />);
      const input = container.querySelector("input[type='file']") as HTMLInputElement;
      const clickSpy = vi.spyOn(input, "click");

      await user.click(screen.getByRole("button", { name: /upload/i }));
      expect(clickSpy).toHaveBeenCalled();
    });

    it("selecting a file calls onFileSelect", async () => {
      const user = userEvent.setup();
      const { container } = render(<LandingView onFileSelect={onFileSelect} />);
      const input = container.querySelector("input[type='file']") as HTMLInputElement;
      const file = new File(["csv,data"], "test.csv", { type: "text/csv" });

      await user.upload(input, file);
      expect(onFileSelect).toHaveBeenCalledWith(file);
    });
  });

  describe("demo button", () => {
    it("fetches example CSV and calls onFileSelect", async () => {
      const user = userEvent.setup();
      const csvBlob = new Blob(["csv,data"], { type: "text/csv" });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(csvBlob),
      });

      render(<LandingView onFileSelect={onFileSelect} />);
      await user.click(screen.getByRole("button", { name: /demo/i }));

      expect(mockFetch).toHaveBeenCalledWith("/examples/example-drive.csv");
      // Wait for async
      await vi.waitFor(() => {
        expect(onFileSelect).toHaveBeenCalledTimes(1);
      });
      const calledFile = onFileSelect.mock.calls[0][0];
      expect(calledFile).toBeInstanceOf(File);
      expect(calledFile.name).toBe("example-drive.csv");
    });

    it("shows error text when fetch fails", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({ ok: false });

      render(<LandingView onFileSelect={onFileSelect} />);
      await user.click(screen.getByRole("button", { name: /demo/i }));

      await vi.waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      });
    });
  });

  describe("demo loading state", () => {
    it("shows 'Loading...' on demo button while fetching", async () => {
      const user = userEvent.setup();
      mockFetch.mockReturnValueOnce(new Promise(() => {})); // never resolves
      render(<LandingView onFileSelect={onFileSelect} />);
      await user.click(screen.getByRole("button", { name: /demo/i }));
      expect(screen.getByText("Loading\u2026")).toBeInTheDocument();
    });

    it("disables demo button while loading", async () => {
      const user = userEvent.setup();
      mockFetch.mockReturnValueOnce(new Promise(() => {}));
      render(<LandingView onFileSelect={onFileSelect} />);
      await user.click(screen.getByRole("button", { name: /demo/i }));
      expect(screen.getByText("Loading\u2026").closest("button")).toBeDisabled();
    });
  });

  describe("drag and drop", () => {
    it("shows overlay on dragEnter", () => {
      const { container } = render(<LandingView onFileSelect={onFileSelect} />);
      const root = container.firstChild as HTMLElement;

      // Use fireEvent from @testing-library/react for reliable React synthetic events
      fireEvent.dragEnter(root, { dataTransfer: { types: ["Files"] } });

      expect(screen.getByText(/drop csv file/i)).toBeInTheDocument();
    });

    it("hides overlay on dragLeave", () => {
      const { container } = render(<LandingView onFileSelect={onFileSelect} />);
      const root = container.firstChild as HTMLElement;

      fireEvent.dragEnter(root, { dataTransfer: { types: ["Files"] } });
      fireEvent.dragLeave(root);

      expect(screen.queryByText(/drop csv file/i)).not.toBeInTheDocument();
    });

    it("calls onFileSelect on drop", () => {
      const { container } = render(<LandingView onFileSelect={onFileSelect} />);
      const root = container.firstChild as HTMLElement;
      const file = new File(["csv,data"], "drive.csv", { type: "text/csv" });

      fireEvent.drop(root, { dataTransfer: { files: [file] } });

      expect(onFileSelect).toHaveBeenCalledWith(file);
    });
  });

  describe("layout", () => {
    it("root fills viewport height", () => {
      const { container } = render(<LandingView onFileSelect={onFileSelect} />);
      expect(container.firstChild).toHaveClass("h-screen");
    });

    it("does not scroll (overflow hidden)", () => {
      const { container } = render(<LandingView onFileSelect={onFileSelect} />);
      expect(container.firstChild).toHaveClass("overflow-hidden");
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/test/LandingView.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement LandingView**

```tsx
// src/components/features/LandingView.tsx
"use client";

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from "react";
import { cn } from "@/lib/utils";

const EXAMPLE_CSV_PATH = "/examples/example-drive.csv";
const EXAMPLE_CSV_NAME = "example-drive.csv";

interface LandingViewProps {
  onFileSelect: (file: File) => void;
}

export function LandingView({ onFileSelect }: LandingViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCountRef = useRef(0);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setError(null);
      onFileSelect(files[0]);
    }
  };

  const handleDemoClick = useCallback(async () => {
    setIsLoadingDemo(true);
    setError(null);
    try {
      const response = await fetch(EXAMPLE_CSV_PATH);
      if (!response.ok) throw new Error("Failed to load example file");
      const blob = await response.blob();
      const file = new File([blob], EXAMPLE_CSV_NAME, { type: "text/csv" });
      onFileSelect(file);
    } catch {
      setError("Failed to load example data");
    } finally {
      setIsLoadingDemo(false);
    }
  }, [onFileSelect]);

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    dragCountRef.current++;
    if (dragCountRef.current === 1) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    dragCountRef.current--;
    if (dragCountRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    dragCountRef.current = 0;
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setError(null);
      onFileSelect(files[0]);
    }
  };

  return (
    <div
      className="h-screen overflow-hidden relative flex flex-col p-6 sm:p-8"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <span className="font-brand text-2xl sm:text-2xl font-semibold text-sapphire-100 tracking-tight">
          OBD2Charts
        </span>
        <div
          data-testid="logo-placeholder"
          className="w-10 h-10 rounded-full bg-sapphire-800 border border-glass-edge flex items-center justify-center"
        >
          <span className="text-xs text-sapphire-500">?</span>
        </div>
      </div>

      {/* Center content — slightly above center */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-[10vh]">
        {/* Upload button — icon only, glass card style */}
        <button
          type="button"
          onClick={handleUploadClick}
          aria-label="Upload CSV file"
          className={cn(
            "glass-card w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] rounded-2xl",
            "flex items-center justify-center",
            "transition-all duration-200",
            "hover:scale-105 hover:border-glass-edge-hover hover:shadow-glow-sapphire",
            "active:scale-[0.97]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sapphire-500/50"
          )}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-sapphire-300"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>

        {/* Demo button */}
        <button
          type="button"
          onClick={handleDemoClick}
          disabled={isLoadingDemo}
          className="mt-3 text-xs font-medium text-sapphire-500 hover:text-sapphire-300 hover:underline transition-colors disabled:opacity-40"
        >
          {isLoadingDemo ? "Loading…" : "Demo"}
        </button>

        {/* Error message */}
        {error && (
          <p className="mt-3 text-xs font-medium text-accent-red-400">{error}</p>
        )}
      </div>

      {/* Bottom-right description */}
      <div className="self-end max-w-xs sm:max-w-sm text-right sm:text-right text-left w-full sm:w-auto">
        <p className="text-xs text-sapphire-500 leading-relaxed">
          Analyze your driving data from OBD2 sensors. Upload a CSV export to
          explore engine performance, fuel efficiency, transmission behavior,
          power output, driving dynamics, braking, AWD, electrical systems, and
          air intake — all visualized in one dashboard.
        </p>
      </div>

      {/* Full-page drag overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-sapphire-950/80 backdrop-blur-sm flex items-center justify-center">
          <div className="border-2 border-dashed border-sapphire-500/50 rounded-2xl m-6 flex-1 h-[calc(100%-48px)] flex flex-col items-center justify-center gap-4">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-sapphire-400"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="text-sm text-sapphire-300 font-medium">
              Drop CSV file here
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/test/LandingView.test.tsx`
Expected: All tests pass. Some drag-and-drop tests may need adjustment depending on jsdom's Event API — fix as needed.

- [ ] **Step 5: Commit**

```bash
git add src/components/features/LandingView.tsx src/test/LandingView.test.tsx
git commit -m "feat: add LandingView with upload, demo, drag-and-drop"
```

---

### Task 5: TimelineSlider Home Button + Tests

**Files:**
- Modify: `src/components/features/TimelineSlider.tsx`
- Modify: `src/test/TimelineSlider.test.tsx`

- [ ] **Step 1: Write the failing test for home button**

Add a new `describe` block to `src/test/TimelineSlider.test.tsx`. The existing file uses a `renderSlider` helper and `buildTimeSeries` factory — extend these for the new prop. Add the following **after** the existing `describe("TimelineSlider", ...)` block:

```tsx
// Add this helper alongside the existing renderSlider
function renderSliderWithHome(timeSeries: OBD2DataPoint[], onHomeClick: () => void) {
  return render(
    React.createElement(TimeRangeProvider, null,
      React.createElement(TimelineSlider, { timeSeries, onHomeClick })
    )
  );
}

describe("TimelineSlider home button", () => {
  it("renders a home button when onHomeClick is provided", () => {
    renderSliderWithHome(buildTimeSeries(), vi.fn());
    expect(screen.getByRole("button", { name: /return to landing/i })).toBeInTheDocument();
  });

  it("does not render home button when onHomeClick is not provided", () => {
    renderSlider(buildTimeSeries());
    expect(screen.queryByRole("button", { name: /return to landing/i })).not.toBeInTheDocument();
  });

  it("calls onHomeClick when pressed", async () => {
    const user = userEvent.setup();
    const onHomeClick = vi.fn();
    renderSliderWithHome(buildTimeSeries(), onHomeClick);
    await user.click(screen.getByRole("button", { name: /return to landing/i }));
    expect(onHomeClick).toHaveBeenCalledTimes(1);
  });
});
```

Also add `import userEvent from "@testing-library/user-event";` to the existing imports at the top of the file.

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npx vitest run src/test/TimelineSlider.test.tsx`
Expected: New home button tests FAIL

- [ ] **Step 3: Add home button to TimelineSlider**

In `src/components/features/TimelineSlider.tsx`:

1. Add `onHomeClick` to the props interface:
```tsx
interface TimelineSliderProps {
  timeSeries: OBD2DataPoint[];
  onHomeClick?: () => void;
}
```

2. Destructure it:
```tsx
export function TimelineSlider({ timeSeries, onHomeClick }: TimelineSliderProps) {
```

3. Add the home button **after** the existing Reset button, inside the same `flex` container:

```tsx
{/* Home button */}
{onHomeClick && (
  <button
    type="button"
    onClick={onHomeClick}
    aria-label="Return to landing"
    className="shrink-0 p-1.5 rounded border border-sapphire-700/40 text-sapphire-400 hover:text-sapphire-200 hover:border-sapphire-600/40 transition-colors"
  >
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  </button>
)}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/test/TimelineSlider.test.tsx`
Expected: All tests pass (existing + new)

- [ ] **Step 5: Commit**

```bash
git add src/components/features/TimelineSlider.tsx src/test/TimelineSlider.test.tsx
git commit -m "feat: add home button to TimelineSlider"
```

---

### Task 6: DashboardView State Machine + Integration Tests

**Files:**
- Modify: `src/components/features/DashboardView.tsx`
- Create: `src/test/DashboardView.test.tsx`

This is the largest task. The `DashboardView` currently renders `FileUpload` + analysis results directly. We refactor it to a 3-state machine: `LANDING | ANALYZING | DASHBOARD`.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/test/DashboardView.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { DashboardView } from "@/components/features/DashboardView";

// Mock fetch for API calls and demo file
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock child components to isolate state machine testing
vi.mock("@/components/features/LandingView", () => ({
  LandingView: ({ onFileSelect }: { onFileSelect: (f: File) => void }) => (
    <div data-testid="landing-view">
      <button onClick={() => onFileSelect(new File(["csv"], "test.csv", { type: "text/csv" }))}>
        mock-upload
      </button>
    </div>
  ),
}));

vi.mock("@/components/features/DotLoader", () => ({
  DotLoader: () => <div data-testid="dot-loader" />,
}));

vi.mock("@/components/features/PixelTransition", () => ({
  PixelTransition: ({ active, onComplete, children }: { active: boolean; onComplete: () => void; children: React.ReactNode }) => {
    // Auto-complete transition immediately in tests
    if (active) {
      setTimeout(onComplete, 0);
    }
    return <div data-testid="pixel-transition">{children}</div>;
  },
}));

describe("DashboardView state machine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts in LANDING state", () => {
    render(<DashboardView />);
    expect(screen.getByTestId("landing-view")).toBeInTheDocument();
  });

  it("does not show dot loader in LANDING state", () => {
    render(<DashboardView />);
    expect(screen.queryByTestId("dot-loader")).not.toBeInTheDocument();
  });

  it("transitions to ANALYZING on file select", async () => {
    const user = userEvent.setup();
    // Mock a pending fetch — must have json() to avoid runtime error
    mockFetch.mockReturnValueOnce(
      new Promise<never>(() => {}) // never resolves, keeps us in analyzing state
    );

    render(<DashboardView />);
    await user.click(screen.getByText("mock-upload"));

    // Pixel transition should fire (auto-completes via mock), after which dot loader appears
    await vi.waitFor(() => {
      expect(screen.getByTestId("dot-loader")).toBeInTheDocument();
    });
  });

  it("transitions to DASHBOARD on successful analysis", async () => {
    const user = userEvent.setup();
    const mockResult = {
      result: {
        sessionId: "test",
        timestamp: Date.now(),
        safetyScore: 85,
        dataPointCount: 100,
        motion: { durationSeconds: 60, totalDistance: 5 },
        engine: {},
        fuel: {},
        transmission: {},
        power: {},
        abs: {},
        awd: {},
        electrical: {},
        airIntake: {},
      },
      timeSeries: [],
      gps: [],
      derived: { fuelSpeedBuckets: [], engineZones: [], cvtRatioOverTime: [], wheelSpeedDiffs: [], awdEvents: [] },
      thresholds: {},
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });

    render(<DashboardView />);
    await user.click(screen.getByText("mock-upload"));

    // Should eventually show dashboard content (safety gauge, etc.)
    await vi.waitFor(() => {
      expect(screen.queryByTestId("landing-view")).not.toBeInTheDocument();
      expect(screen.queryByTestId("dot-loader")).not.toBeInTheDocument();
    });
  });

  it("returns to LANDING when error occurs", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Bad file" }),
    });

    render(<DashboardView />);
    await user.click(screen.getByText("mock-upload"));

    await vi.waitFor(() => {
      // Should show landing again with error visible
      expect(screen.getByTestId("landing-view")).toBeInTheDocument();
    });
  });

  it("returns to LANDING when home button is clicked from DASHBOARD", async () => {
    const user = userEvent.setup();
    const mockResult = {
      result: {
        sessionId: "test",
        timestamp: Date.now(),
        safetyScore: 85,
        dataPointCount: 100,
        motion: { durationSeconds: 60, totalDistance: 5 },
        engine: {},
        fuel: {},
        transmission: {},
        power: {},
        abs: {},
        awd: {},
        electrical: {},
        airIntake: {},
      },
      // Include 2+ data points so TimelineSlider renders (and home button appears)
      timeSeries: [
        { timestamp: 1000, vehicleSpeed: 50 },
        { timestamp: 1060, vehicleSpeed: 60 },
      ],
      gps: [],
      derived: { fuelSpeedBuckets: [], engineZones: [], cvtRatioOverTime: [], wheelSpeedDiffs: [], awdEvents: [] },
      thresholds: {},
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });

    render(<DashboardView />);

    // Reach DASHBOARD state
    await user.click(screen.getByText("mock-upload"));
    await vi.waitFor(() => {
      expect(screen.queryByTestId("landing-view")).not.toBeInTheDocument();
    });

    // Click the home button on the TimelineSlider
    const homeButton = screen.getByRole("button", { name: /return to landing/i });
    await user.click(homeButton);

    // Should return to landing
    await vi.waitFor(() => {
      expect(screen.getByTestId("landing-view")).toBeInTheDocument();
    });
  });
});
```

**Note:** These tests mock child components to focus on state transitions. The actual component rendering is tested via each component's own test file. Adjust mock return shapes to match the actual API response if needed — read `src/types/index.ts` for exact field names.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/test/DashboardView.test.tsx`
Expected: FAIL — state machine not yet implemented

- [ ] **Step 3: Refactor DashboardView to state machine**

In `src/components/features/DashboardView.tsx`, restructure the component:

1. Add new imports at the top:
```tsx
import { LandingView } from "@/components/features/LandingView";
import { DotLoader } from "@/components/features/DotLoader";
import { PixelTransition } from "@/components/features/PixelTransition";
```

2. Define a view state type. (The spec defines 3 states; `dissolving` is an implementation sub-state of the LANDING→ANALYZING transition for the pixel effect.)
```tsx
type ViewState = "landing" | "dissolving" | "analyzing" | "dashboard";
```

3. In the `DashboardView` function body, add a `viewState` state:
```tsx
const [viewState, setViewState] = useState<ViewState>("landing");
```

4. Modify `handleFileSelect` to trigger dissolve first:
```tsx
const handleFileSelect = async (file: File) => {
  setViewState("dissolving");
  // Store file for use after transition
  pendingFileRef.current = file;
};

const handleDissolveComplete = () => {
  setViewState("analyzing");
  if (pendingFileRef.current) {
    analyzeFile(pendingFileRef.current);
  }
};
```

5. Extract the API call into `analyzeFile(file: File)`:
```tsx
const analyzeFile = async (file: File) => {
  setIsAnalyzing(true);
  setError(null);
  // ... existing fetch logic ...
  // On success: setViewState("dashboard")
  // On error: setViewState("landing"), setError(...)
};
```

6. Add `handleHomeClick` that resets everything:
```tsx
const handleHomeClick = () => {
  setResult(null);
  setTimeSeries([]);
  setGps([]);
  setDerived(null);
  setThresholds(null);
  setError(null);
  setViewState("landing");
};
```

7. Update the render to switch on `viewState`:
```tsx
return (
  <TimeRangeProvider>
    <div className="min-h-screen bg-sapphire-950">
      {viewState === "landing" && (
        <LandingView onFileSelect={handleFileSelect} />
      )}

      {viewState === "dissolving" && (
        <PixelTransition active={true} onComplete={handleDissolveComplete}>
          <LandingView onFileSelect={handleFileSelect} />
        </PixelTransition>
      )}

      {viewState === "analyzing" && (
        <div className="h-screen flex items-center justify-center">
          <DotLoader />
        </div>
      )}

      {viewState === "dashboard" && hasAllData && (
        <>
          {/* Existing header, summary chips, safety gauge */}
          <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-8 animate-fade-up">
            {/* ... existing trip summary header code ... */}
          </div>

          <DashboardContent
            result={result}
            timeSeries={timeSeries}
            gps={gps}
            derived={derived}
            thresholds={thresholds}
            onHomeClick={handleHomeClick}
          />
        </>
      )}

      {/* Error display — shown on landing state */}
      {viewState === "landing" && error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
          <div className="glass-card px-4 py-3 border-accent-red-500/30">
            <p className="text-xs text-accent-red-400">{error}</p>
          </div>
        </div>
      )}
    </div>
  </TimeRangeProvider>
);
```

8. Pass `onHomeClick` through `DashboardContent` down to `TimelineSlider`. Update the `DashboardContent` function signature (currently at line ~62 of `DashboardView.tsx`):

```tsx
function DashboardContent({
  result,
  timeSeries,
  gps,
  derived,
  thresholds,
  onHomeClick,
}: {
  result: OBD2AnalysisResult;
  timeSeries: OBD2DataPoint[];
  gps: GPSDataPoint[];
  derived: DerivedMetrics;
  thresholds: ThresholdConfig;
  onHomeClick: () => void;
}) {
```

Then in the `DashboardContent` render, pass the prop to `TimelineSlider`:
```tsx
<TimelineSlider timeSeries={timeSeries} onHomeClick={onHomeClick} />
```

9. Remove the old `FileUpload` usage, loading card, empty state card, and error card from the existing render. These are now handled by `LandingView`, `DotLoader`, and the error toast.

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (DashboardView + DotLoader + PixelTransition + LandingView + existing tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/features/DashboardView.tsx src/test/DashboardView.test.tsx
git commit -m "feat: refactor DashboardView to landing/analyzing/dashboard state machine"
```

---

### Task 7: Visual Verification

**Files:** None (manual check)

- [ ] **Step 1: Run dev server and test full flow**

Run: `npm run dev`

Verify in browser:
1. Landing page fills viewport — "OBD2Charts" in Doto font top-left, round placeholder top-right
2. Upload button is centered above-middle, glass-card style
3. "Demo" text button below upload
4. Description paragraph bottom-right
5. Drag a file over the page → full-screen overlay with dashed border appears
6. Click upload → pixel dissolve → dot loader → dashboard appears
7. Click "Demo" → same flow with example data
8. On dashboard, home icon visible at far-right of timeline slider
9. Click home icon → returns to landing, all data cleared
10. No vertical scroll on landing page
11. Body text is Geist Sans throughout

- [ ] **Step 2: Test responsive**

Open DevTools responsive mode:
- 375px width (iPhone SE): padding 24px, upload button 72px, description full-width at bottom
- 768px width (iPad): padding 32px, upload button 88px, description bottom-right
- 1280px width (desktop): same as 768px

- [ ] **Step 3: Run linter and type checker**

```bash
npm run lint && npm run type-check
```

Fix any issues found.

- [ ] **Step 4: Run full test suite**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 5: Commit any fixes**

```bash
git add -u
git commit -m "fix: address lint/type issues from landing redesign"
```

---

### Task 8: Coverage Verification

**Files:** Possibly new tests if coverage gaps found

- [ ] **Step 1: Run tests with coverage**

```bash
npx vitest run --coverage
```

Check that all new files have 100% coverage:
- `src/components/features/DotLoader.tsx`
- `src/components/features/PixelTransition.tsx`
- `src/components/features/LandingView.tsx`
- `src/components/features/DashboardView.tsx` (the state machine parts)
- `src/components/features/TimelineSlider.tsx` (the home button branch)

- [ ] **Step 2: Add any missing tests for uncovered branches**

Common gaps to check:
- LandingView: file input rejecting non-CSV
- PixelTransition: unmount during active animation (cleanup)
- DashboardView: multiple rapid file selections
- TimelineSlider: home button not rendered when `onHomeClick` is undefined

Write tests for any uncovered lines.

- [ ] **Step 3: Re-run coverage and verify 100%**

```bash
npx vitest run --coverage
```

All new component files should show 100% line/branch/function coverage.

- [ ] **Step 4: Final commit**

```bash
git add -u
git commit -m "test: achieve 100% coverage for landing redesign components"
```
