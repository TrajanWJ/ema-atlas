"use client";

import { useEffect, useState } from "react";

import { ClientWorkSection, type ClientWorkClient } from "./client-work-section";
import { SidebarSection } from "./sidebar-section";
import {
	selectClientWork,
	selectProjectsByKind,
	selectSpaces,
} from "../data/projections";
import type { CockpitProject, CockpitSpace } from "../data/types";
import { cockpitNavigate } from "../router";

interface SidebarState {
	readonly spaces: readonly CockpitSpace[];
	readonly clientWork: readonly ClientWorkClient[];
	readonly personal: readonly CockpitProject[];
	readonly internal: readonly CockpitProject[];
}

const EMPTY_STATE: SidebarState = {
	spaces: [],
	clientWork: [],
	personal: [],
	internal: [],
};

export interface SidebarProps {
	readonly activeRoute: string;
}

export function Sidebar({ activeRoute }: SidebarProps) {
	const [state, setState] = useState<SidebarState>(EMPTY_STATE);
	const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		async function load() {
			const [spaces, clientWork, personal, internal] = await Promise.all([
				selectSpaces(),
				selectClientWork(),
				selectProjectsByKind("personal"),
				selectProjectsByKind("internal"),
			]);
			if (cancelled) return;
			setState({
				spaces,
				clientWork: clientWork.map((item) => ({
					id: item.client.id,
					name: item.client.name,
					color: item.client.color,
					projects: item.projects.map((project) => ({
						id: project.id,
						name: project.name,
					})),
				})),
				personal,
				internal,
			});
			setSelectedSpaceId(
				(prev) =>
					prev ?? spaces.find((space) => space.kind === "default")?.id ?? spaces[0]?.id ?? null,
			);
		}
		load().catch(() => {
			/* TODO(slice-5): surface daemon read errors */
		});
		return () => {
			cancelled = true;
		};
	}, []);

	const selectedClientWork = selectedSpaceId
		? state.clientWork
				.map((item) => ({
					...item,
					projects: item.projects,
				}))
				.filter((item) => item.projects.length > 0)
		: state.clientWork;
	const selectedPersonal = selectedSpaceId
		? state.personal.filter((project) => project.space_id === selectedSpaceId)
		: state.personal;
	const selectedInternal = selectedSpaceId
		? state.internal.filter((project) => project.space_id === selectedSpaceId)
		: state.internal;

	return (
		<aside className="cockpit-sidebar">
			<header className="cockpit-sidebar__brand">
				<a
					href="#/now"
					onClick={(event) => {
						event.preventDefault();
						cockpitNavigate("/now");
					}}
					className="cockpit-sidebar__brand-link"
				>
					<span className="cockpit-sidebar__brand-name">cockpit</span>
					<span className="cockpit-sidebar__brand-tag">work tracker</span>
				</a>
			</header>

			{state.spaces.length > 0 ? (
				<label className="cockpit-sidebar__space-picker">
					<span>Space</span>
					<select
						value={selectedSpaceId ?? ""}
						onChange={(event) => setSelectedSpaceId(event.target.value)}
					>
						{state.spaces.map((space) => (
							<option key={space.id} value={space.id}>
								{space.name} - {space.kind}
							</option>
						))}
					</select>
				</label>
			) : null}

			<SidebarSection
				title="NOW"
				defaultOpen
				activeRoute={activeRoute}
				items={[
					{ route: "/capture", label: "Brain Dump" },
					{ route: "/now", label: "Next" },
					{ route: "/tl", label: "tl about" },
				]}
			/>

			<ClientWorkSection clients={selectedClientWork} activeRoute={activeRoute} />

			<SidebarSection
				title="PERSONAL"
				defaultOpen
				activeRoute={activeRoute}
				emptyHint="no personal projects yet"
				items={selectedPersonal.map((project) => ({
					route: `/personal/${project.id}`,
					label: project.name,
					dot: project.client_color ?? "var(--place-accent-personal)",
				}))}
			/>

			<SidebarSection
				title="WORKSHOP"
				defaultOpen={false}
				activeRoute={activeRoute}
				emptyHint="no internal projects"
				items={selectedInternal.map((project) => ({
					route: `/workshop/${project.id}`,
					label: project.name,
					dot: project.client_color ?? "var(--place-accent-internal)",
				}))}
			/>

			<footer className="cockpit-sidebar__footer">
				<span className="cockpit-sidebar__mono">EMA-grammar</span>
				<span> sibling of </span>
				<span className="cockpit-sidebar__mono">@ema/contracts</span>
			</footer>
		</aside>
	);
}
