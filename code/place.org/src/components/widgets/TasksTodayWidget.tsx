'use client';

import { useEffect } from 'react';
import { useTaskStore } from '@/src/stores/task-store';
import { useWindowStore } from '@/src/stores/window-store';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_VISIBLE = 5;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TasksTodayWidget() {
	const tasks = useTaskStore((s) => s.tasks);
	const loading = useTaskStore((s) => s.loading);
	const load = useTaskStore((s) => s.load);
	const update = useTaskStore((s) => s.update);

	useEffect(() => {
		if (tasks.length === 0 && !loading) {
			load();
		}
	}, [tasks.length, loading, load]);

	const todayTasks = tasks.filter(
		(t) => t.status === 'today' || t.status === 'in-progress',
	);
	const visible = todayTasks.slice(0, MAX_VISIBLE);
	const remaining = todayTasks.length - visible.length;

	function openTasksApp() {
		useWindowStore.getState().openWindow('tasks');
	}

	return (
		<div
			style={{
				width: 180,
				padding: '6px 10px 8px',
				display: 'flex',
				flexDirection: 'column',
				gap: 3,
			}}
		>
			{loading && (
				<span style={{ fontSize: '0.65rem', color: 'var(--place-text-tertiary)' }}>
					Loading...
				</span>
			)}

			{!loading && todayTasks.length === 0 && (
				<span style={{ fontSize: '0.65rem', color: 'var(--place-text-tertiary)' }}>
					No tasks for today
				</span>
			)}

			{visible.map((task) => (
				<label
					key={task.id}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 5,
						cursor: 'default',
					}}
				>
					<input
						type="checkbox"
						checked={task.status === 'complete'}
						onChange={() => update(task.id, { status: 'complete' })}
						style={{
							accentColor: 'var(--place-primary-400)',
							width: 12,
							height: 12,
							flexShrink: 0,
						}}
					/>
					<span
						style={{
							fontSize: '0.65rem',
							color: 'var(--place-text-primary)',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
							maxWidth: 140,
						}}
					>
						{task.title}
					</span>
				</label>
			))}

			{remaining > 0 && (
				<span
					style={{
						fontSize: '0.6rem',
						color: 'var(--place-text-tertiary)',
						paddingLeft: 17,
					}}
				>
					+{remaining} more
				</span>
			)}

			<button
				type="button"
				onClick={openTasksApp}
				style={{
					background: 'none',
					border: 'none',
					color: 'var(--place-primary-400)',
					fontSize: '0.6rem',
					cursor: 'default',
					textAlign: 'left',
					padding: '2px 0 0',
				}}
			>
				Open Tasks →
			</button>
		</div>
	);
}
