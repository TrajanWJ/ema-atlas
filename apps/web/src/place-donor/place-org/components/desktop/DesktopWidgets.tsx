'use client';

import { useCallback, useRef } from 'react';
import { useWidgetStore } from '@/src/stores/widget-store';
import type { DesktopWidget, WidgetType } from '@/src/stores/widget-store';
import { ClockWidget } from '@/src/components/widgets/ClockWidget';
import { TasksTodayWidget } from '@/src/components/widgets/TasksTodayWidget';
import { HabitStreakWidget } from '@/src/components/widgets/HabitStreakWidget';
import { WeatherWidget } from '@/src/components/widgets/WeatherWidget';

// ---------------------------------------------------------------------------
// Widget renderer
// ---------------------------------------------------------------------------

function WidgetContent({ type }: { readonly type: WidgetType }) {
	switch (type) {
		case 'clock':
			return <ClockWidget />;
		case 'tasks-today':
			return <TasksTodayWidget />;
		case 'habit-streak':
			return <HabitStreakWidget />;
		case 'weather':
			return <WeatherWidget />;
	}
}

const WIDGET_LABELS: Record<WidgetType, string> = {
	clock: 'Clock',
	'tasks-today': 'Tasks',
	'habit-streak': 'Habits',
	weather: 'Weather',
};

// ---------------------------------------------------------------------------
// Draggable widget shell
// ---------------------------------------------------------------------------

function DraggableWidget({ widget }: { readonly widget: DesktopWidget }) {
	const moveWidget = useWidgetStore((s) => s.moveWidget);
	const removeWidget = useWidgetStore((s) => s.removeWidget);
	const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent) => {
			e.preventDefault();
			e.stopPropagation();
			(e.target as HTMLElement).setPointerCapture(e.pointerId);
			dragRef.current = {
				startX: e.clientX,
				startY: e.clientY,
				originX: widget.x,
				originY: widget.y,
			};
		},
		[widget.x, widget.y],
	);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!dragRef.current) return;
			const dx = e.clientX - dragRef.current.startX;
			const dy = e.clientY - dragRef.current.startY;
			moveWidget(widget.id, dragRef.current.originX + dx, dragRef.current.originY + dy);
		},
		[widget.id, moveWidget],
	);

	const handlePointerUp = useCallback(() => {
		dragRef.current = null;
	}, []);

	return (
		<div
			style={{
				position: 'absolute',
				left: widget.x,
				top: widget.y,
				zIndex: 4,
				borderRadius: 12,
				background: 'rgba(14,16,23,0.72)',
				backdropFilter: 'blur(16px)',
				WebkitBackdropFilter: 'blur(16px)',
				border: '1px solid var(--place-border-default)',
				overflow: 'hidden',
				boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
				userSelect: 'none',
			}}
		>
			{/* Title bar — drag handle */}
			<div
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '3px 8px',
					cursor: 'grab',
					borderBottom: '1px solid var(--place-border-subtle)',
				}}
			>
				<span
					style={{
						fontSize: '0.55rem',
						fontWeight: 600,
						letterSpacing: '0.06em',
						textTransform: 'uppercase',
						color: 'var(--place-text-tertiary)',
					}}
				>
					{WIDGET_LABELS[widget.type]}
				</span>
				<button
					type="button"
					onClick={() => removeWidget(widget.id)}
					style={{
						background: 'none',
						border: 'none',
						color: 'var(--place-text-tertiary)',
						fontSize: '0.7rem',
						cursor: 'default',
						padding: '0 2px',
						lineHeight: 1,
					}}
					aria-label={`Close ${WIDGET_LABELS[widget.type]} widget`}
				>
					×
				</button>
			</div>

			{/* Widget body */}
			<WidgetContent type={widget.type} />
		</div>
	);
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function DesktopWidgets() {
	const widgets = useWidgetStore((s) => s.widgets);
	const visible = widgets.filter((w) => w.visible);

	if (visible.length === 0) return null;

	return (
		<div
			className="absolute inset-0 pointer-events-none"
			style={{ zIndex: 4 }}
		>
			{visible.map((w) => (
				<div key={w.id} className="pointer-events-auto">
					<DraggableWidget widget={w} />
				</div>
			))}
		</div>
	);
}
