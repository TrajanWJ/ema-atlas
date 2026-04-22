'use client';

import { useState } from 'react';
import type { IconData } from './DesktopShortcuts';

// ── Individual icon ──

interface DesktopIconProps {
	readonly icon: IconData;
	readonly isSelected: boolean;
	readonly isDragging: boolean;
	readonly onPointerDown: (e: React.PointerEvent) => void;
	readonly onPointerMove: (e: React.PointerEvent) => void;
	readonly onPointerUp: () => void;
	readonly onDoubleClick: () => void;
}

export function DesktopIcon({
	icon,
	isSelected,
	isDragging,
	onPointerDown,
	onPointerMove,
	onPointerUp,
	onDoubleClick,
}: DesktopIconProps) {
	const [hovered, setHovered] = useState(false);

	const isFolder = icon.type === 'folder';
	const childCount = icon.children?.length ?? 0;

	return (
		<div
			data-icon
			data-icon-id={icon.id}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onDoubleClick={onDoubleClick}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			title={icon.description}
			style={{
				position: 'absolute',
				left: icon.x,
				top: icon.y,
				width: 72,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 4,
				padding: 6,
				borderRadius: 10,
				cursor: 'default',
				touchAction: 'none',
				userSelect: 'none',
				zIndex: isDragging ? 100 : undefined,
				transform: isDragging ? 'scale(1.05)' : undefined,
				boxShadow: isDragging
					? '0 8px 24px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)'
					: undefined,
				background: isSelected
					? 'rgba(45, 212, 168, 0.10)'
					: hovered
						? 'rgba(255,255,255,0.04)'
						: 'transparent',
				border: isSelected
					? '1px solid rgba(45, 212, 168, 0.25)'
					: '1px solid transparent',
				transition:
					'background 0.1s, border-color 0.1s, transform 0.15s, box-shadow 0.15s',
			}}
		>
			<div
				style={{
					position: 'relative',
					width: 44,
					height: 44,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					borderRadius: 10,
					color: isSelected
						? 'var(--place-primary-400, #2DD4A8)'
						: 'var(--place-text-secondary)',
					background:
						hovered || isSelected
							? 'rgba(255,255,255,0.06)'
							: 'rgba(255,255,255,0.03)',
				}}
			>
				{icon.icon}
				{isFolder && childCount > 0 && <FolderBadge count={childCount} />}
			</div>
			<span
				style={{
					fontSize: 10,
					lineHeight: '1.3',
					textAlign: 'center',
					color: isSelected
						? 'var(--place-primary-300, #5EEAD4)'
						: 'var(--place-text-secondary)',
					textShadow:
						'0 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.8)',
					wordBreak: 'break-word',
					overflow: 'hidden',
					display: '-webkit-box',
					WebkitLineClamp: 2,
					WebkitBoxOrient: 'vertical',
				}}
			>
				{icon.label}
			</span>
		</div>
	);
}

// ── Folder badge ──

function FolderBadge({ count }: { readonly count: number }) {
	return (
		<span
			style={{
				position: 'absolute',
				top: -4,
				right: -4,
				minWidth: 16,
				height: 16,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				borderRadius: 8,
				background: 'var(--place-primary-400, #2DD4A8)',
				color: '#000',
				fontSize: 9,
				fontWeight: 700,
				padding: '0 4px',
				lineHeight: 1,
			}}
		>
			{count}
		</span>
	);
}
