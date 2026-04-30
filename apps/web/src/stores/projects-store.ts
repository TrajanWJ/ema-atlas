import { create } from "zustand";
import {
	addProject,
	getProjects,
	updateProject,
	deleteProject,
} from "@/src/db/queries/projects";
import { getDbClient } from "@/src/db/client";
import type { Project, ProjectStatus } from "@/src/types/project";

interface ProjectsState {
	readonly projects: readonly Project[];
	readonly activeProjectId: string | null;
	readonly loading: boolean;
}

interface ProjectsActions {
	load(): Promise<void>;
	create(title: string, description?: string, color?: string): Promise<Project>;
	update(
		id: string,
		changes: Partial<Pick<Project, "title" | "description" | "color" | "status" | "priority" | "sortOrder">>,
	): Promise<void>;
	remove(id: string): Promise<void>;
	setActive(id: string | null): void;
}

type ProjectsStore = ProjectsState & ProjectsActions;

export const useProjectsStore = create<ProjectsStore>((set, get) => ({
	projects: [],
	activeProjectId: null,
	loading: false,

	async load() {
		set({ loading: true });
		try {
			const db = getDbClient();
			const projects = await getProjects(db);
			set({ projects, loading: false });
		} catch (err) {
			console.error("[projects-store] load failed:", err);
			set({ loading: false });
		}
	},

	async create(title, description, color) {
		const db = getDbClient();
		const project = await addProject(db, title, description ?? null, color ?? null);
		set({ projects: [project, ...get().projects] });
		return project;
	},

	async update(id, changes) {
		const db = getDbClient();
		await updateProject(db, id, changes);
		set({
			projects: get().projects.map((p) =>
				p.id === id
					? {
							...p,
							...changes,
							updatedAt: new Date().toISOString(),
					  } as Project
					: p,
			),
		});
	},

	async remove(id) {
		const db = getDbClient();
		await deleteProject(db, id);
		const { activeProjectId } = get();
		set({
			projects: get().projects.filter((p) => p.id !== id),
			activeProjectId: activeProjectId === id ? null : activeProjectId,
		});
	},

	setActive(id) {
		set({ activeProjectId: id });
	},
}));

export function filterProjectsByStatus(
	projects: readonly Project[],
	status: ProjectStatus,
): readonly Project[] {
	return projects.filter((p) => p.status === status);
}
