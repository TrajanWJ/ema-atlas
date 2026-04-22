import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------
const mockUpdateContent = vi.fn();
const mockSaveEntry = vi.fn().mockResolvedValue(undefined);
const mockLoadEntry = vi.fn().mockResolvedValue(undefined);
const mockSetCurrentDate = vi.fn().mockResolvedValue(undefined);

const journalState = {
	currentEntry: {
		id: "test-id",
		date: "2026-03-20",
		content: "## 🎯 Today's Focus\ntest content",
		oneThing: null,
		mood: null,
		energyP: 5,
		energyM: 5,
		energyE: 5,
		gratitude: null,
		tags: null,
		createdAt: "2026-03-20T00:00:00.000Z",
		updatedAt: "2026-03-20T00:00:00.000Z",
	},
	currentDate: "2026-03-20",
	loading: false,
	updateContent: mockUpdateContent,
	saveEntry: mockSaveEntry,
	loadEntry: mockLoadEntry,
	setCurrentDate: mockSetCurrentDate,
	updateEnergy: vi.fn(),
	updateOneThing: vi.fn(),
};

vi.mock("../../src/stores/journal-store", () => ({
	useJournalStore: (selector: (s: typeof journalState) => unknown) =>
		selector(journalState),
}));

import { JournalEditor } from "../../src/components/apps/journal/JournalEditor";
import { CalendarStrip } from "../../src/components/apps/journal/CalendarStrip";

// ----------------------------------------------------------------------------
// JournalEditor tests
// ----------------------------------------------------------------------------
describe("JournalEditor", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("renders textarea with current content", () => {
		render(<JournalEditor />);
		const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
		expect(textarea.value).toBe("## 🎯 Today's Focus\ntest content");
	});

	it("calls updateContent when text changes", () => {
		render(<JournalEditor />);
		const textarea = screen.getByRole("textbox");
		fireEvent.change(textarea, { target: { value: "new content" } });
		expect(mockUpdateContent).toHaveBeenCalledWith("new content");
	});

	it("calls saveEntry after debounce delay", async () => {
		render(<JournalEditor />);
		const textarea = screen.getByRole("textbox");
		fireEvent.change(textarea, { target: { value: "save me" } });

		expect(mockSaveEntry).not.toHaveBeenCalled();

		await act(async () => {
			vi.advanceTimersByTime(600);
		});

		expect(mockSaveEntry).toHaveBeenCalledOnce();
	});

	it("is disabled when loading", () => {
		journalState.loading = true;
		render(<JournalEditor />);
		const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
		expect(textarea.disabled).toBe(true);
		journalState.loading = false;
	});
});

// ----------------------------------------------------------------------------
// CalendarStrip tests
// ----------------------------------------------------------------------------
describe("CalendarStrip", () => {
	const onNavigate = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders prev and next buttons", () => {
		render(<CalendarStrip currentDate="2026-03-20" onNavigate={onNavigate} />);
		expect(screen.getByLabelText("Previous day")).toBeDefined();
		expect(screen.getByLabelText("Next day")).toBeDefined();
	});

	it("calls onNavigate with previous date on prev click", () => {
		render(<CalendarStrip currentDate="2026-03-20" onNavigate={onNavigate} />);
		fireEvent.click(screen.getByLabelText("Previous day"));
		expect(onNavigate).toHaveBeenCalledWith("2026-03-19");
	});

	it("shows 'Today' when currentDate is today", () => {
		const today = new Date().toISOString().slice(0, 10);
		render(<CalendarStrip currentDate={today} onNavigate={onNavigate} />);
		expect(screen.getByText("Today")).toBeDefined();
	});

	it("next button is disabled for future dates", () => {
		const today = new Date().toISOString().slice(0, 10);
		render(<CalendarStrip currentDate={today} onNavigate={onNavigate} />);
		const nextBtn = screen.getByLabelText("Next day") as HTMLButtonElement;
		expect(nextBtn.disabled).toBe(true);
	});
});
