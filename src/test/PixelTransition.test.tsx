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

  it("does not render pixel grid overlay when inactive", () => {
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
