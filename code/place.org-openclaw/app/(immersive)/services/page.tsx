const services = [
	{
		name: "Searx",
		description: "Privacy-focused meta search engine. No tracking, no ads.",
		icon: "🔍",
		href: "#",
	},
	{
		name: "Commafeed",
		description: "Self-hosted RSS feed reader. Stay informed, your way.",
		icon: "📡",
		href: "#",
	},
	{
		name: "Hubzilla",
		description: "Federated social platform. Own your identity.",
		icon: "🌐",
		href: "#",
	},
] as const;

function ServiceCard({
	name,
	description,
	icon,
	href,
}: {
	name: string;
	description: string;
	icon: string;
	href: string;
}) {
	return (
		<div
			className="glass group flex flex-col gap-4 rounded-xl p-6 transition-all duration-300"
			style={{
				boxShadow: "0 0 0 transparent",
			}}
			data-service-card
		>
			<div className="flex items-start justify-between">
				<span className="text-4xl" role="img" aria-label={name}>
					{icon}
				</span>
				<span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--accent-success)" }}>
					<span
						className="inline-block h-2 w-2 rounded-full"
						style={{ backgroundColor: "var(--accent-success)" }}
						aria-hidden="true"
					/>
					Available
				</span>
			</div>

			<div className="flex flex-col gap-1">
				<h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
					{name}
				</h2>
				<p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
					{description}
				</p>
			</div>

			<div className="mt-auto pt-2">
				<a
					href={href}
					target="_blank"
					rel="noopener noreferrer"
					aria-label={`Launch ${name}`}
					className="inline-block rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200"
					style={{
						backgroundColor: "rgba(91, 156, 245, 0.12)",
						border: "1px solid rgba(91, 156, 245, 0.25)",
						color: "var(--accent-blue)",
					}}
				>
					Launch
				</a>
			</div>
		</div>
	);
}

export default function ServicesPage() {
	return (
		<main className="mx-auto max-w-5xl px-6 py-16">
			<header className="mb-12 text-center">
				<h1 className="mb-3 text-4xl font-bold" style={{ color: "var(--text-primary)" }}>
					place.org Services
				</h1>
				<p className="text-base" style={{ color: "var(--text-secondary)" }}>
					Self-hosted tools running on Debian GNU/Linux
				</p>
			</header>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				{services.map((service) => (
					<ServiceCard
						key={service.name}
						name={service.name}
						description={service.description}
						icon={service.icon}
						href={service.href}
					/>
				))}
			</div>
		</main>
	);
}
