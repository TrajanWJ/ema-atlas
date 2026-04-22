import { usePipesStore } from "@/src/stores/pipes-store";

const SEED_KEY = "place-pipes-seeded";

/**
 * Seeds an example pipe on first open:
 * trigger: timer:session_completed -> action: brain-dump create_item
 */
export function seedExamplePipe(): void {
	if (typeof window === "undefined") return;
	if (localStorage.getItem(SEED_KEY)) return;

	const { pipes, addPipe } = usePipesStore.getState();
	if (pipes.length > 0) {
		localStorage.setItem(SEED_KEY, "1");
		return;
	}

	addPipe({
		name: "Log Focus Sessions",
		triggerId: "timer:session_completed",
		actions: [
			{ appId: "brain-dump", actionId: "create_item" },
		],
		active: true,
	});

	localStorage.setItem(SEED_KEY, "1");
}
