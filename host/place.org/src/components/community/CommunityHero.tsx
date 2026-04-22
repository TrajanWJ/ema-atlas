export function CommunityHero() {
	return (
		<header className="py-16 text-center">
			<h1
				className="mb-4 text-4xl font-bold tracking-tight"
				style={{ color: "var(--place-text-primary)" }}
			>
				The People of place.org
			</h1>
			<p
				className="mx-auto max-w-xl text-lg leading-relaxed"
				style={{ color: "var(--place-text-secondary)" }}
			>
				place.org has been a home for creators, thinkers, and builders since its
				founding. Running proudly on Debian GNU/Linux.
			</p>
		</header>
	);
}
