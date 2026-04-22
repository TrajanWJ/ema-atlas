import { organizations } from "@/src/data/community";
import type { Organization } from "@/src/data/community";

function OrgCard({ org }: { org: Organization }) {
	return (
		<div className="glass flex flex-col gap-3 rounded-xl p-6 transition-colors duration-200 hover:border-[var(--border-hover)]">
			<h3
				className="text-lg font-semibold"
				style={{ color: "var(--text-primary)" }}
			>
				{org.name}
			</h3>
			<p
				className="flex-1 text-sm leading-relaxed"
				style={{ color: "var(--text-secondary)" }}
			>
				{org.description}
			</p>
			<a
				href={org.url}
				className="mt-1 self-start text-sm transition-colors hover:underline"
				style={{ color: "var(--accent-blue)" }}
				target="_blank"
				rel="noopener noreferrer"
			>
				Visit &rarr;
			</a>
		</div>
	);
}

export function OrganizationsSection() {
	return (
		<section aria-labelledby="orgs-heading" className="mb-16">
			<h2
				id="orgs-heading"
				className="mb-8 text-2xl font-semibold"
				style={{ color: "var(--text-primary)" }}
			>
				Organizations
			</h2>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{organizations.map((org) => (
					<OrgCard key={org.name} org={org} />
				))}
			</div>
		</section>
	);
}
