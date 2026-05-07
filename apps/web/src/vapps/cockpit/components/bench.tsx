"use client";

import { useState, type ReactNode } from "react";

export interface BenchTab {
	readonly id: string;
	readonly label: string;
	readonly count?: number;
	readonly content: ReactNode;
}

export interface BenchProps {
	readonly tabs: readonly BenchTab[];
	readonly defaultTab?: string;
}

export function Bench({ tabs, defaultTab }: BenchProps) {
	const initial = defaultTab ?? tabs[0]?.id ?? "";
	const [active, setActive] = useState<string>(initial);
	const tab = tabs.find((entry) => entry.id === active);

	return (
		<div className="cockpit-bench">
			<nav className="cockpit-bench__tabs" aria-label="Bench tabs">
				{tabs.map((entry) => {
					const isActive = entry.id === active;
					return (
						<button
							key={entry.id}
							type="button"
							onClick={() => setActive(entry.id)}
							className={
								isActive
									? "cockpit-bench__tab cockpit-bench__tab--active"
									: "cockpit-bench__tab"
							}
							aria-current={isActive ? "true" : undefined}
						>
							{entry.label}
							{typeof entry.count === "number" ? (
								<span className="cockpit-bench__count">{entry.count}</span>
							) : null}
						</button>
					);
				})}
			</nav>
			<div className="cockpit-bench__panel">{tab?.content}</div>
		</div>
	);
}
