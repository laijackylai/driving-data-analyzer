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

  it("uses window dimensions when innerWidth and innerHeight are > 0", () => {
    // Override jsdom's zero dimensions so the true branch of the cols/rows ternary runs
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1200 });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 800 });

    const { container } = render(
      <PixelTransition active={true} onComplete={vi.fn()}>
        <p>Hello</p>
      </PixelTransition>
    );
    // cols = ceil(1200/24) = 50, rows = ceil(800/24) = 34 → 1700 cells
    const cells = container.querySelectorAll("[data-testid='pixel-cell']");
    expect(cells.length).toBe(Math.ceil(1200 / 24) * Math.ceil(800 / 24));

    // Restore jsdom defaults
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 0 });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 0 });
  });

  it("uses custom cellSize to compute grid dimensions", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 480 });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 320 });

    const cellSize = 40;
    const { container } = render(
      <PixelTransition active={true} onComplete={vi.fn()} cellSize={cellSize}>
        <p>Hello</p>
      </PixelTransition>
    );
    const cells = container.querySelectorAll("[data-testid='pixel-cell']");
    expect(cells.length).toBe(Math.ceil(480 / cellSize) * Math.ceil(320 / cellSize));

    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 0 });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 0 });
  });
});
