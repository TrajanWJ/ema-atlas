'use client';

import { useMemo } from 'react';
import type { RssItem } from '@/src/stores/rss-store';
import { sanitizeHtml } from '@/src/lib/rss-parser';
import { RssIcon } from '@/src/components/icons/RssIcon';

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function formatDate(ts: number): string {
	if (!ts) return '';
	const d = new Date(ts);
	const now = new Date();
	const diff = now.getTime() - d.getTime();

	if (diff < 3_600_000) {
		const mins = Math.floor(diff / 60_000);
		return `${mins}m ago`;
	}
	if (diff < 86_400_000) {
		const hrs = Math.floor(diff / 3_600_000);
		return `${hrs}h ago`;
	}
	if (diff < 604_800_000) {
		const days = Math.floor(diff / 86_400_000);
		return `${days}d ago`;
	}
	return d.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
	});
}

function canRenderEmbeddedImage(src: string | null): src is string {
	if (!src) return false;
	if (/^(data|blob):/i.test(src)) return true;
	if (src.startsWith('/')) return true;
	if (typeof window === 'undefined') return false;

	try {
		return new URL(src, window.location.href).origin === window.location.origin;
	} catch {
		return false;
	}
}

// ----------------------------------------------------------------------------
// Reading View
// ----------------------------------------------------------------------------

export function ReadingView({
	item,
	feedName,
}: {
	readonly item: RssItem | null;
	readonly feedName: string;
}) {
	const sanitized = useMemo(
		() => (item ? sanitizeHtml(item.description) : ''),
		[item],
	);

	if (!item) {
		return (
			<div
				className="flex h-full flex-col items-center justify-center gap-2"
				style={{ color: 'var(--place-text-tertiary)' }}
			>
				<RssIcon size={32} />
				<span style={{ fontSize: '0.75rem' }}>
					Select an article to read
				</span>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col overflow-y-auto">
			<div className="flex flex-col gap-2 p-3">
				{canRenderEmbeddedImage(item.thumbnail) && (
					<img
						src={item.thumbnail}
						alt=""
						style={{
							width: '100%',
							maxHeight: 180,
							objectFit: 'cover',
							borderRadius: 6,
						}}
					/>
				)}

				<h2
					style={{
						fontSize: '0.9rem',
						fontWeight: 700,
						color: 'var(--place-text-primary)',
						lineHeight: 1.3,
						margin: 0,
					}}
				>
					{item.title}
				</h2>

				<div
					className="flex items-center gap-2"
					style={{
						fontSize: '0.675rem',
						color: 'var(--place-text-tertiary)',
					}}
				>
					<span>{feedName}</span>
					{item.pubDate > 0 && (
						<>
							<span>·</span>
							<span>{formatDate(item.pubDate)}</span>
						</>
					)}
					{item.link && (
						<>
							<span>·</span>
							<a
								href={item.link}
								target="_blank"
								rel="noopener noreferrer"
								style={{
									color: 'var(--place-accent)',
									textDecoration: 'none',
								}}
							>
								Open in Browser
							</a>
						</>
					)}
				</div>

				<div
					className="rss-content"
					style={{
						fontSize: '0.78rem',
						lineHeight: 1.6,
						color: 'var(--place-text-secondary)',
						wordBreak: 'break-word',
					}}
					dangerouslySetInnerHTML={{ __html: sanitized }}
				/>
			</div>
		</div>
	);
}
