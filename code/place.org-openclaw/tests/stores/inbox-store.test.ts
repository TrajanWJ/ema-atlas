import { describe, it, expect, vi, beforeEach } from "vitest";
import type { InboxItem } from "../../src/types/inbox";

// ----------------------------------------------------------------------------
// Mock the DB client and query modules before importing the store
// ----------------------------------------------------------------------------

const mockGetUnprocessedItems = vi.fn();
const mockAddInboxItem = vi.fn();
const mockProcessItem = vi.fn();
const mockDeleteItem = vi.fn();

vi.mock("../../src/db/queries/inbox", () => ({
	getUnprocessedItems: (...args: unknown[]) => mockGetUnprocessedItems(...args),
	addInboxItem: (...args: unknown[]) => mockAddInboxItem(...args),
	processItem: (...args: unknown[]) => mockProcessItem(...args),
	deleteItem: (...args: unknown[]) => mockDeleteItem(...args),
}));

vi.mock("../../src/db/client", () => ({
	getDbClient: () => ({}),
}));

// Import after mocks are set up
const { useInboxStore } = await import("../../src/stores/inbox-store");

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function makeItem(overrides?: Partial<InboxItem>): InboxItem {
	return {
		id: "item-1",
		content: "Test note",
		source: "text",
		processed: false,
		action: null,
		createdAt: "2026-03-20T12:00:00.000Z",
		processedAt: null,
		updatedAt: "2026-03-20T12:00:00.000Z",
		...overrides,
	};
}

// Reset store and mocks between tests
beforeEach(() => {
	useInboxStore.setState({ items: [], loading: false });
	vi.clearAllMocks();
});

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe("load", () => {
	it("populates items from getUnprocessedItems", async () => {
		const items = [makeItem({ id: "a" }), makeItem({ id: "b" })];
		mockGetUnprocessedItems.mockResolvedValueOnce(items);

		await useInboxStore.getState().load();

		expect(useInboxStore.getState().items).toEqual(items);
	});

	it("sets loading true during fetch and false after", async () => {
		let loadingDuringFetch = false;
		mockGetUnprocessedItems.mockImplementationOnce(async () => {
			loadingDuringFetch = useInboxStore.getState().loading;
			return [];
		});

		await useInboxStore.getState().load();

		expect(loadingDuringFetch).toBe(true);
		expect(useInboxStore.getState().loading).toBe(false);
	});

	it("sets loading false even if query throws", async () => {
		mockGetUnprocessedItems.mockRejectedValueOnce(new Error("DB error"));

		await expect(useInboxStore.getState().load()).rejects.toThrow("DB error");
		expect(useInboxStore.getState().loading).toBe(false);
	});
});

describe("add", () => {
	it("prepends the new item to the existing items", async () => {
		const existing = makeItem({ id: "old", content: "old" });
		useInboxStore.setState({ items: [existing] });

		const newItem = makeItem({ id: "new", content: "new" });
		mockAddInboxItem.mockResolvedValueOnce(newItem);

		await useInboxStore.getState().add("new");

		const { items } = useInboxStore.getState();
		expect(items[0]).toEqual(newItem);
		expect(items[1]).toEqual(existing);
	});

	it("calls addInboxItem with the given content and source", async () => {
		mockAddInboxItem.mockResolvedValueOnce(makeItem());

		await useInboxStore.getState().add("voice note", "voice");

		expect(mockAddInboxItem).toHaveBeenCalledOnce();
		const [, content, source] = mockAddInboxItem.mock.calls[0] as unknown as [unknown, string, string];
		expect(content).toBe("voice note");
		expect(source).toBe("voice");
	});

	it("defaults source to text", async () => {
		mockAddInboxItem.mockResolvedValueOnce(makeItem());
		await useInboxStore.getState().add("plain text");

		const [, , source] = mockAddInboxItem.mock.calls[0] as unknown as [unknown, string, string];
		expect(source).toBe("text");
	});
});

describe("process", () => {
	it("removes the item from the list", async () => {
		useInboxStore.setState({ items: [makeItem({ id: "x" }), makeItem({ id: "y" })] });
		mockProcessItem.mockResolvedValueOnce(undefined);

		await useInboxStore.getState().process("x", "task");

		const ids = useInboxStore.getState().items.map((i) => i.id);
		expect(ids).not.toContain("x");
		expect(ids).toContain("y");
	});

	it("calls processItem with the correct id and action", async () => {
		useInboxStore.setState({ items: [makeItem({ id: "p1" })] });
		mockProcessItem.mockResolvedValueOnce(undefined);

		await useInboxStore.getState().process("p1", "journal");

		const [, id, action] = mockProcessItem.mock.calls[0] as unknown as [unknown, string, string];
		expect(id).toBe("p1");
		expect(action).toBe("journal");
	});
});

describe("remove", () => {
	it("removes the item from the list", async () => {
		useInboxStore.setState({
			items: [makeItem({ id: "r1" }), makeItem({ id: "r2" })],
		});
		mockDeleteItem.mockResolvedValueOnce(undefined);

		await useInboxStore.getState().remove("r1");

		const ids = useInboxStore.getState().items.map((i) => i.id);
		expect(ids).not.toContain("r1");
		expect(ids).toContain("r2");
	});

	it("calls deleteItem with the correct id", async () => {
		useInboxStore.setState({ items: [makeItem({ id: "del" })] });
		mockDeleteItem.mockResolvedValueOnce(undefined);

		await useInboxStore.getState().remove("del");

		const [, id] = mockDeleteItem.mock.calls[0] as unknown as [unknown, string];
		expect(id).toBe("del");
	});
});
