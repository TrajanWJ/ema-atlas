import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Task } from "../../src/types/task";

// ----------------------------------------------------------------------------
// Mock DB queries and client
// ----------------------------------------------------------------------------

const mockAddTask = vi.fn();
const mockGetTasks = vi.fn();
const mockUpdateTask = vi.fn();
const mockCompleteTask = vi.fn();
const mockArchiveTask = vi.fn();
const mockReorderTask = vi.fn();

vi.mock("../../src/db/queries/tasks", () => ({
	addTask: (...args: unknown[]) => mockAddTask(...args),
	getTasks: (...args: unknown[]) => mockGetTasks(...args),
	updateTask: (...args: unknown[]) => mockUpdateTask(...args),
	completeTask: (...args: unknown[]) => mockCompleteTask(...args),
	archiveTask: (...args: unknown[]) => mockArchiveTask(...args),
	reorderTask: (...args: unknown[]) => mockReorderTask(...args),
}));

vi.mock("../../src/db/client", () => ({
	getDbClient: () => ({}),
}));

const { useTaskStore, selectTasksByPriority, selectPendingTasks, selectCompletedTasks } =
	await import("../../src/stores/task-store");

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function makeTask(overrides?: Partial<Task>): Task {
	return {
		id: "task-1",
		title: "Test task",
		description: null,
		priority: "should",
		category: null,
		status: "pending",
		dueDate: null,
		goalId: null,
		sortOrder: 0,
		createdAt: "2026-03-20T12:00:00.000Z",
		completedAt: null,
		incompleteReason: null,
		updatedAt: "2026-03-20T12:00:00.000Z",
		...overrides,
	};
}

beforeEach(() => {
	useTaskStore.setState({ tasks: [], loading: false });
	vi.clearAllMocks();
});

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe("load", () => {
	it("populates tasks from getTasks", async () => {
		const tasks = [makeTask({ id: "a" }), makeTask({ id: "b" })];
		mockGetTasks.mockResolvedValueOnce(tasks);

		await useTaskStore.getState().load();

		expect(useTaskStore.getState().tasks).toEqual(tasks);
	});

	it("sets loading during fetch and resets after", async () => {
		let loadingDuring = false;
		mockGetTasks.mockImplementationOnce(async () => {
			loadingDuring = useTaskStore.getState().loading;
			return [];
		});

		await useTaskStore.getState().load();

		expect(loadingDuring).toBe(true);
		expect(useTaskStore.getState().loading).toBe(false);
	});
});

describe("add", () => {
	it("appends a new task to the list", async () => {
		const task = makeTask({ id: "new", title: "New task", priority: "must" });
		mockAddTask.mockResolvedValueOnce(task);

		await useTaskStore.getState().add("New task", "must");

		expect(useTaskStore.getState().tasks).toContainEqual(task);
	});

	it("calls addTask with correct args", async () => {
		mockAddTask.mockResolvedValueOnce(makeTask());

		await useTaskStore.getState().add("Buy milk", "could", "errands");

		const [, title, priority, category] = mockAddTask.mock.calls[0] as unknown as [unknown, string, string, string];
		expect(title).toBe("Buy milk");
		expect(priority).toBe("could");
		expect(category).toBe("errands");
	});
});

describe("complete", () => {
	it("marks task status as complete", async () => {
		useTaskStore.setState({ tasks: [makeTask({ id: "t1" })] });
		mockCompleteTask.mockResolvedValueOnce(undefined);

		await useTaskStore.getState().complete("t1");

		const task = useTaskStore.getState().tasks.find((t) => t.id === "t1");
		expect(task?.status).toBe("complete");
		expect(task?.completedAt).toBeTruthy();
	});

	it("calls completeTask with correct id", async () => {
		useTaskStore.setState({ tasks: [makeTask({ id: "t2" })] });
		mockCompleteTask.mockResolvedValueOnce(undefined);

		await useTaskStore.getState().complete("t2");

		const [, id] = mockCompleteTask.mock.calls[0] as unknown as [unknown, string];
		expect(id).toBe("t2");
	});
});

describe("archive", () => {
	it("marks task status as archived", async () => {
		useTaskStore.setState({ tasks: [makeTask({ id: "a1" })] });
		mockArchiveTask.mockResolvedValueOnce(undefined);

		await useTaskStore.getState().archive("a1");

		const task = useTaskStore.getState().tasks.find((t) => t.id === "a1");
		expect(task?.status).toBe("archived");
	});
});

describe("reorder", () => {
	it("updates sortOrder of the task", async () => {
		useTaskStore.setState({ tasks: [makeTask({ id: "r1", sortOrder: 0 })] });
		mockReorderTask.mockResolvedValueOnce(undefined);

		await useTaskStore.getState().reorder("r1", 5);

		const task = useTaskStore.getState().tasks.find((t) => t.id === "r1");
		expect(task?.sortOrder).toBe(5);
	});
});

describe("priority filtering selectors", () => {
	const tasks: readonly Task[] = [
		makeTask({ id: "m1", priority: "must", status: "pending" }),
		makeTask({ id: "s1", priority: "should", status: "pending" }),
		makeTask({ id: "c1", priority: "could", status: "pending" }),
		makeTask({ id: "done1", priority: "must", status: "complete" }),
		makeTask({ id: "arch1", priority: "should", status: "archived" }),
	];

	it("selectTasksByPriority returns only matching priority (excludes archived)", () => {
		const mustTasks = selectTasksByPriority(tasks, "must");
		expect(mustTasks.map((t) => t.id)).toEqual(["m1"]);
	});

	it("selectPendingTasks returns only pending", () => {
		const pending = selectPendingTasks(tasks);
		expect(pending.map((t) => t.id)).toEqual(["m1", "s1", "c1"]);
	});

	it("selectCompletedTasks returns only complete", () => {
		const done = selectCompletedTasks(tasks);
		expect(done.map((t) => t.id)).toEqual(["done1"]);
	});

	it("selectTasksByPriority returns empty for priority with no matches", () => {
		const filtered = selectTasksByPriority(tasks, "could");
		expect(filtered.map((t) => t.id)).toEqual(["c1"]);
	});
});
