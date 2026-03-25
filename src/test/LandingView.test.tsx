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
