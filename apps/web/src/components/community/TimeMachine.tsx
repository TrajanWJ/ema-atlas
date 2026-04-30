export function TimeMachine() {
	return (
		<section
			aria-labelledby="time-machine-heading"
			className="mb-16 rounded-2xl px-8 py-12 text-center"
			style={{
				background: "rgba(232, 168, 76, 0.06)",
				border: "1px solid rgba(232, 168, 76, 0.25)",
			}}
		>
			<style>{`
				@keyframes scanline {
					0% { background-position: 0 0; }
					100% { background-position: 0 4px; }
				}
				.time-machine-btn:hover::after {
					content: '';
					position: absolute;
					inset: 0;
					border-radius: inherit;
					background: repeating-linear-gradient(
						0deg,
						transparent,
						transparent 2px,
						rgba(0,0,0,0.08) 2px,
						rgba(0,0,0,0.08) 4px
					);
					background-size: 100% 4px;
					animation: scanline 0.15s linear infinite;
					pointer-events: none;
				}
				.time-machine-btn {
					position: relative;
					overflow: hidden;
				}
			`}</style>

			<div
				className="mb-2 text-sm font-mono uppercase tracking-widest"
				style={{ color: "var(--place-tertiary-400)" }}
			>
				&#x2588;&#x2588; TEMPORAL NAVIGATION SYSTEM &#x2588;&#x2588;
			</div>

			<h2
				id="time-machine-heading"
				className="mb-4 text-2xl font-bold"
				style={{ color: "var(--place-text-primary)" }}
			>
				Want to see how place.org looked before?
			</h2>

			<p
				className="mx-auto mb-8 max-w-md text-sm leading-relaxed"
				style={{ color: "var(--place-text-secondary)" }}
			>
				Step back through the archives and experience the original place.org in
				all its vintage glory. A piece of internet history, preserved.
			</p>

			<a
				href="/oldplace/"
				className="time-machine-btn inline-flex items-center gap-3 rounded-lg border px-8 py-3 font-mono font-semibold transition-colors duration-200"
				style={{
					color: "var(--place-tertiary-400)",
					borderColor: "rgba(232, 168, 76, 0.5)",
					backgroundColor: "rgba(232, 168, 76, 0.08)",
				}}
			>
				<span aria-hidden="true">&#x23F0;</span>
				Enter the Time Machine
				<span aria-hidden="true">&#x23F0;</span>
			</a>
		</section>
	);
}
