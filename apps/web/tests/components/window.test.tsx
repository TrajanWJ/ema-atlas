import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WindowTitleBar } from "../../src/components/window-manager/WindowTitleBar";

describe("WindowTitleBar", () => {
	it("renders the app name", () => {
		render(
			<WindowTitleBar
				appName="Brain Dump"
				onMinimize={vi.fn()}
				onMaximize={vi.fn()}
				onClose={vi.fn()}
			/>,
		);
		expect(screen.getByText("Brain Dump")).toBeDefined();
	});

	it("calls onClose when close button is clicked", () => {
		const onClose = vi.fn();
		render(
			<WindowTitleBar
				appName="Test App"
				onMinimize={vi.fn()}
				onMaximize={vi.fn()}
				onClose={onClose}
			/>,
		);
		fireEvent.click(screen.getByLabelText("Close window"));
		expect(onClose).toHaveBeenCalledOnce();
	});

	it("calls onMinimize when minimize button is clicked", () => {
		const onMinimize = vi.fn();
		render(
			<WindowTitleBar
				appName="Test App"
				onMinimize={onMinimize}
				onMaximize={vi.fn()}
				onClose={vi.fn()}
			/>,
		);
		fireEvent.click(screen.getByLabelText("Minimize window"));
		expect(onMinimize).toHaveBeenCalledOnce();
	});

	it("calls onMaximize when maximize button is clicked", () => {
		const onMaximize = vi.fn();
		render(
			<WindowTitleBar
				appName="Test App"
				onMinimize={vi.fn()}
				onMaximize={onMaximize}
				onClose={vi.fn()}
			/>,
		);
		fireEvent.click(screen.getByLabelText("Maximize window"));
		expect(onMaximize).toHaveBeenCalledOnce();
	});

	it("has a drag-handle class for react-rnd", () => {
		const { container } = render(
			<WindowTitleBar
				appName="Test App"
				onMinimize={vi.fn()}
				onMaximize={vi.fn()}
				onClose={vi.fn()}
			/>,
		);
		expect(container.querySelector(".drag-handle")).not.toBeNull();
	});
});
