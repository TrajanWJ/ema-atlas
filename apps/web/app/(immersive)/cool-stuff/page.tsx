import { CoolStuffGrid } from '@/src/components/cool-stuff/CoolStuffGrid';

export default function CoolStuffPage() {
	return (
		<main
			style={{
				minHeight: '100dvh',
				backgroundColor: 'var(--bg-deep)',
				color: 'var(--text-primary)',
				padding: '3rem 2rem',
				overflowY: 'auto',
			}}
		>
			<div style={{ maxWidth: '960px', margin: '0 auto' }}>
				{/* Header */}
				<div style={{ marginBottom: '2.5rem' }}>
					<h1
						style={{
							fontSize: '2rem',
							fontWeight: 700,
							letterSpacing: '-0.02em',
							margin: 0,
							marginBottom: '0.5rem',
						}}
					>
						Cool Stuff
					</h1>
					<p
						style={{
							fontSize: '0.9375rem',
							color: 'var(--text-secondary)',
							margin: 0,
							lineHeight: 1.6,
						}}
					>
						Curated discoveries — tools, sites, experiments, and resources worth knowing about.
					</p>
				</div>

				<CoolStuffGrid />
			</div>
		</main>
	);
}
