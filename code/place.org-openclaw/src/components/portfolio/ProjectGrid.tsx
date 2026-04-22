'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ProjectCard } from './ProjectCard';
import type { Project } from '@/src/data/projects';

type Props = {
	projects: readonly Project[];
};

function AnimatedCard({ project, index }: { project: Project; index: number }) {
	const ref = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					setVisible(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.1 },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	return (
		<motion.div
			ref={ref}
			initial={{ opacity: 0, y: 24 }}
			animate={visible ? { opacity: 1, y: 0 } : {}}
			transition={{
				delay: (index % 3) * 0.08,
				duration: 0.5,
				ease: [0.65, 0.05, 0, 1],
			}}
		>
			<ProjectCard project={project} />
		</motion.div>
	);
}

export function ProjectGrid({ projects }: Props) {
	return (
		<section className="px-6 pb-24" aria-label="Projects">
			<div className="mx-auto max-w-6xl">
				<motion.h2
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="mb-10 text-center text-sm font-medium uppercase tracking-widest"
					style={{ color: 'var(--text-secondary)' }}
				>
					Projects
				</motion.h2>
				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
					{projects.map((project, i) => (
						<AnimatedCard key={project.id} project={project} index={i} />
					))}
				</div>
			</div>
		</section>
	);
}
