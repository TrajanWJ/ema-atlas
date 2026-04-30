import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CaptureInput } from "../../src/components/apps/brain-dump/CaptureInput";

describe("CaptureInput", () => {
	it("renders the input and submit button", () => {
		render(<CaptureInput onCapture={vi.fn()} />);
		expect(screen.getByRole("textbox")).toBeDefined();
		expect(screen.getByRole("button", { name: /add/i })).toBeDefined();
	});

	it("calls onCapture with trimmed text on submit", () => {
		const onCapture = vi.fn();
		render(<CaptureInput onCapture={onCapture} />);

		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "  hello world  " } });
		fireEvent.submit(input.closest("form") as HTMLFormElement);

		expect(onCapture).toHaveBeenCalledWith("hello world");
	});

	it("rejects empty input — onCapture not called", () => {
		const onCapture = vi.fn();
		render(<CaptureInput onCapture={onCapture} />);

		const form = screen.getByRole("button", { name: /add/i }).closest("form");
		fireEvent.submit(form as HTMLFormElement);

		expect(onCapture).not.toHaveBeenCalled();
	});

	it("rejects whitespace-only input", () => {
		const onCapture = vi.fn();
		render(<CaptureInput onCapture={onCapture} />);

		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "   " } });
		fireEvent.submit(input.closest("form") as HTMLFormElement);

		expect(onCapture).not.toHaveBeenCalled();
	});

	it("clears the input after a successful capture", () => {
		const onCapture = vi.fn();
		render(<CaptureInput onCapture={onCapture} />);

		const input = screen.getByRole("textbox") as HTMLInputElement;
		fireEvent.change(input, { target: { value: "capture this" } });
		fireEvent.submit(input.closest("form") as HTMLFormElement);

		expect(input.value).toBe("");
	});

	it("disables the button when disabled prop is true", () => {
		render(<CaptureInput onCapture={vi.fn()} disabled />);
		const button = screen.getByRole("button", { name: /add/i }) as HTMLButtonElement;
		expect(button.disabled).toBe(true);
	});
});
