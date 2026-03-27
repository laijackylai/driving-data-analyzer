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

  it("defines display font family using Geist Sans", () => {
    expect(fontFamily.display).toBeDefined();
    expect(fontFamily.display[0]).toBe("var(--font-geist-sans)");
  });

  it("preserves mono font family (JetBrains Mono)", () => {
    expect(fontFamily.mono).toBeDefined();
    expect(fontFamily.mono[0]).toBe("var(--font-jetbrains)");
  });
});
