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
    expect(screen.getByText("Analyzing\u2026")).toBeInTheDocument();
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
