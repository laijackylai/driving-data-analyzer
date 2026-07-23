import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import { DotLoader } from "@/components/features/DotLoader";

describe("DotLoader", () => {
  it("renders three dots", () => {
    const { container } = render(<DotLoader />);
    const dots = container.querySelectorAll("[data-testid='dot']");
    expect(dots).toHaveLength(3);
  });

  it("renders the 'Analyzing' label text", () => {
    render(<DotLoader />);
    // The component renders LABELS[labelIndex] (initially "Analyzing", no
    // ellipsis) as its own element, separate from the animated dot spans.
    expect(screen.getByText("Analyzing")).toBeInTheDocument();
  });

  it("applies staggered opacity classes to dots as dotCount advances", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<DotLoader />);
      const dots = container.querySelectorAll("[data-testid='dot']");

      // Initial render: dotCount starts at 1, so only the first dot is lit.
      expect(dots[0]).toHaveClass("opacity-100");
      expect(dots[1]).toHaveClass("opacity-0");
      expect(dots[2]).toHaveClass("opacity-0");

      // After 400ms, dotCount advances to 2: first two dots lit.
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(dots[0]).toHaveClass("opacity-100");
      expect(dots[1]).toHaveClass("opacity-100");
      expect(dots[2]).toHaveClass("opacity-0");

      // After another 400ms, dotCount advances to 3: all dots lit.
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(dots[0]).toHaveClass("opacity-100");
      expect(dots[1]).toHaveClass("opacity-100");
      expect(dots[2]).toHaveClass("opacity-100");
    } finally {
      vi.useRealTimers();
    }
  });

  it("accepts custom className", () => {
    const { container } = render(<DotLoader className="mt-8" />);
    expect(container.firstChild).toHaveClass("mt-8");
  });
});
