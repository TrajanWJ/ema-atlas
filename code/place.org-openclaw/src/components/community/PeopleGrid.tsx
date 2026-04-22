import { people } from "@/src/data/community";
import type { Person } from "@/src/data/community";

const AVATAR_COLORS = [
	"#5b9cf5",
	"#38c97a",
	"#e8a84c",
	"#ef6b6b",
	"#a78bfa",
] as const;

function PersonCard({ person, index }: { person: Person; index: number }) {
	const initial = person.name.charAt(0).toUpperCase();
	const color = AVATAR_COLORS[index % AVATAR_COLORS.length];

	return (
		<div
			className="glass flex flex-col items-center gap-4 rounded-xl p-6 transition-colors duration-200 hover:border-[var(--border-hover)]"
		>
			<div
				aria-hidden="true"
				className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white"
				style={{ backgroundColor: color }}
			>
				{initial}
			</div>
			<div className="text-center">
				<p
					className="mb-1 font-semibold"
					style={{ color: "var(--text-primary)" }}
				>
					{person.name}
				</p>
				<a
					href={person.url}
					className="text-sm transition-colors hover:underline"
					style={{ color: "var(--accent-blue)" }}
					target="_blank"
					rel="noopener noreferrer"
				>
					{person.urlLabel}
				</a>
			</div>
		</div>
	);
}

export function PeopleGrid() {
	return (
		<section aria-labelledby="people-heading" className="mb-16">
			<h2
				id="people-heading"
				className="mb-8 text-2xl font-semibold"
				style={{ color: "var(--text-primary)" }}
			>
				People
			</h2>
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
				{people.map((person, i) => (
					<PersonCard key={person.name} person={person} index={i} />
				))}
			</div>
		</section>
	);
}
