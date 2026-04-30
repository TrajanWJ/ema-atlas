import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StickyNote } from "../../src/components/widgets/StickyNote";
import { useStickyStore } from "../../src/stores/sticky-store";
import type { StickyNote as StickyNoteType } from "../../src/stores/sticky-store";

// react-rnd renders a draggable wrapper — mock it to render children directly
vi.mock("react-rnd", () => ({
	Rnd: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const NOTE: StickyNoteType = {
	id: "test-id",
	content: "Hello world",
	color: "yellow",
	x: 100,
	y: 100,
	rotation: 1.5,
};

beforeEach(() => {
	useStickyStore.setState({ notes: new Map([["test-id", NOTE]]) });
});

describe("StickyNote", () => {
	it("renders with content", () => {
		render(<StickyNote note={NOTE} />);
		expect(screen.getByTestId("sticky-content").textContent).toBe("Hello world");
	});

	it("calls updateNote when content changes", () => {
		const updateNote = vi.fn();
		useStickyStore.setState({
			notes: new Map([["test-id", NOTE]]),
			updateNote,
		});

		render(<StickyNote note={NOTE} />);
		const content = screen.getByTestId("sticky-content");
		// jsdom does not compute innerText; set it directly before firing the event
		Object.defineProperty(content, "innerText", { value: "New text", writable: true });
		fireEvent.input(content);

		expect(updateNote).toHaveBeenCalledWith("test-id", "New text");
	});

	it("calls removeNote when close button is clicked", () => {
		const removeNote = vi.fn();
		useStickyStore.setState({
			notes: new Map([["test-id", NOTE]]),
			removeNote,
		});

		render(<StickyNote note={NOTE} />);
		fireEvent.click(screen.getByLabelText("Close sticky note"));

		expect(removeNote).toHaveBeenCalledWith("test-id");
	});
});
