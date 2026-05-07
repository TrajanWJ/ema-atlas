"use client";

import { useEffect, useState } from "react";

import { CaptureForm, captureProjectsForForm } from "../components/capture-form";
import { selectProjectsByKind } from "../data/projections";
import type { CockpitProject } from "../data/types";

export function CapturePage() {
	const [projects, setProjects] = useState<readonly CockpitProject[] | null>(null);

	useEffect(() => {
		let cancelled = false;
		selectProjectsByKind("all")
			.then((value) => {
				if (cancelled) return;
				setProjects(value);
			})
			.catch(() => {
				if (cancelled) return;
				setProjects([]);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<div className="cockpit-stack">
			<header className="cockpit-page-header">
				<p className="cockpit-eyebrow">BRAIN DUMP</p>
				<h1 className="cockpit-page-title">Capture</h1>
				<p className="cockpit-page-meta">
					One thought per record. Required: title, why, done-when. The rest can be filled
					later, but not skipped - captured items stay in their{" "}
					<span className="cockpit-mono">proposal</span> state until you promote them.
				</p>
			</header>
			{projects === null ? (
				<p className="cockpit-empty">Loading projects...</p>
			) : (
				<CaptureForm projects={captureProjectsForForm(projects)} />
			)}
		</div>
	);
}
