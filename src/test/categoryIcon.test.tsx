import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import {
  CategoryIcon,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  CATEGORY_SHORT_LABELS,
} from "@/components/ui/CategoryIcon";

describe("CATEGORY_ORDER", () => {
  it("starts with summary", () => {
    expect(CATEGORY_ORDER[0]).toBe("summary");
  });

  it("has 19 categories total", () => {
    expect(CATEGORY_ORDER.length).toBe(19);
  });

  it("includes all expected categories", () => {
    const expected = [
      "summary", "overview", "engine", "fuel", "transmission",
      "power", "drivingBehavior", "abs", "awd", "electrical", "airIntake",
      "cobbEngine", "cobbBoost", "cobbAFR", "cobbPower", "cobbKnock",
      "cobbWastegate", "cobbInjector", "cobbAVCS",
    ];
    expect([...CATEGORY_ORDER]).toEqual(expected);
  });

  it("every category has a label", () => {
    for (const cat of CATEGORY_ORDER) {
      expect(CATEGORY_LABELS[cat]).toBeTruthy();
    }
  });

  it("every category has a short label", () => {
    for (const cat of CATEGORY_ORDER) {
      expect(CATEGORY_SHORT_LABELS[cat]).toBeTruthy();
    }
  });
});

describe("CategoryIcon", () => {
  it("renders an SVG for every category in CATEGORY_ORDER", () => {
    for (const cat of CATEGORY_ORDER) {
      const { container } = render(React.createElement(CategoryIcon, { category: cat }));
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
    }
  });

  it("renders summary icon (4-grid)", () => {
    const { container } = render(React.createElement(CategoryIcon, { category: "summary" }));
    const rects = container.querySelectorAll("rect");
    expect(rects.length).toBe(4);
  });

  it("sets aria-hidden on all icons", () => {
    for (const cat of CATEGORY_ORDER) {
      const { container } = render(React.createElement(CategoryIcon, { category: cat }));
      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("renders fallback for unknown category", () => {
    const { container } = render(React.createElement(CategoryIcon, { category: "unknown" }));
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("respects custom size prop", () => {
    const { container } = render(
      React.createElement(CategoryIcon, { category: "engine", size: 32 })
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("32");
    expect(svg?.getAttribute("height")).toBe("32");
  });
});
