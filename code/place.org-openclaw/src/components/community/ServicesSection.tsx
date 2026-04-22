import { services } from "@/src/data/community";
import type { Service } from "@/src/data/community";

function ExternalIcon() {
	return (
		<svg
			aria-hidden="true"
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
			<polyline points="15 3 21 3 21 9" />
			<line x1="10" y1="14" x2="21" y2="3" />
		</svg>
	);
}

function ServiceCard({ service }: { service: Service }) {
	return (
		<div className="glass flex flex-col gap-4 rounded-xl p-6 transition-colors duration-200 hover:border-[var(--border-hover)]">
			<div>
				<h3
					className="mb-2 text-lg font-semibold"
					style={{ color: "var(--text-primary)" }}
				>
					{service.name}
				</h3>
				<p
					className="text-sm leading-relaxed"
					style={{ color: "var(--text-secondary)" }}
				>
					{service.description}
				</p>
			</div>
			<a
				href={service.url}
				className="inline-flex items-center gap-2 self-start rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
				style={{ backgroundColor: "var(--accent-blue)" }}
				target="_blank"
				rel="noopener noreferrer"
			>
				Launch
				<ExternalIcon />
			</a>
		</div>
	);
}

export function ServicesSection() {
	return (
		<section aria-labelledby="services-heading" className="mb-16">
			<h2
				id="services-heading"
				className="mb-8 text-2xl font-semibold"
				style={{ color: "var(--text-primary)" }}
			>
				Services
			</h2>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{services.map((service) => (
					<ServiceCard key={service.name} service={service} />
				))}
			</div>
		</section>
	);
}
