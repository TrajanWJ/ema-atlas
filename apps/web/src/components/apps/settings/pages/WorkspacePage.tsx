'use client';

import { SettingsPage } from '../SettingsPage';
import { Section, SettingRow } from './shared';
import { useTopbar } from '@/src/projections/use-topbar';
import { EMA_SCOPE } from '@/src/app/mock-projections';

/**
 * Workspace settings — current scope (org / space / project) read from the
 * daemon's `topbar` projection (mock fallback when offline). The switcher
 * itself lands in Wave III; for now we expose a deep-link button that
 * pushes the scope IDs into the URL so other surfaces can react.
 */
export function WorkspacePage() {
	const topbar = useTopbar();
	const { org, space, project } = topbar.scope;

	const orgId = org?.id ?? EMA_SCOPE.orgId;
	const orgName = org?.name ?? EMA_SCOPE.orgName;
	const spaceId = space?.id ?? EMA_SCOPE.spaceId;
	const spaceName = space?.name ?? EMA_SCOPE.spaceName;
	const projectId = project?.id ?? EMA_SCOPE.projectId;
	const projectName = project?.name ?? EMA_SCOPE.projectName;

	function pushScopeToUrl() {
		if (typeof window === 'undefined') return;
		const params = new URLSearchParams(window.location.search);
		params.set('org', orgId);
		params.set('space', spaceId);
		params.set('project', projectId);
		const next = `${window.location.pathname}?${params.toString()}`;
		window.history.pushState({}, '', next);
	}

	return (
		<SettingsPage
			icon="🏢"
			title="Workspace"
			description="Current org / space / project scope. Switching lands in Wave III."
		>
			<div style={{ padding: '1rem' }}>
				<Section title="Current scope">
					<SettingRow label="Organization" description={orgId}>
						<span
							style={{
								fontSize: '0.78rem',
								color: 'var(--place-text-primary)',
								fontWeight: 500,
							}}
						>
							{orgName}
						</span>
					</SettingRow>
					<SettingRow label="Space" description={spaceId}>
						<span
							style={{
								fontSize: '0.78rem',
								color: 'var(--place-text-primary)',
								fontWeight: 500,
							}}
						>
							{spaceName}
						</span>
					</SettingRow>
					<SettingRow label="Project" description={projectId}>
						<span
							style={{
								fontSize: '0.78rem',
								color: 'var(--place-text-primary)',
								fontWeight: 500,
							}}
						>
							{projectName}
						</span>
					</SettingRow>
				</Section>

				<Section title="Source">
					<div
						style={{
							fontSize: '0.68rem',
							color: 'var(--place-text-muted)',
							lineHeight: 1.5,
						}}
					>
						{topbar.offline
							? 'Daemon offline — showing staged scope from EMA_SCOPE.'
							: 'Live from daemon `topbar` projection.'}
					</div>
				</Section>

				<Section title="Switch project">
					<SettingRow
						label="Push scope to URL"
						description="Updates ?org=…&space=…&project=… so deep-links pick up the current scope. Workspace switcher coming in Wave III."
					>
						<button
							type="button"
							onClick={pushScopeToUrl}
							style={{
								padding: '0.35rem 0.75rem',
								borderRadius: '6px',
								border: '1px solid var(--place-border-default)',
								background: 'var(--place-surface-2)',
								color: 'var(--place-text-primary)',
								fontSize: '0.72rem',
								cursor: 'pointer',
							}}
						>
							Push to URL
						</button>
					</SettingRow>
				</Section>
			</div>
		</SettingsPage>
	);
}
