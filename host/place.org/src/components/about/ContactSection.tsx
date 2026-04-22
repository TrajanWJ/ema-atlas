'use client';

import { useState } from "react";
import { ScrollReveal } from "./ScrollReveal";

interface SocialLink {
	readonly label: string;
	readonly href: string;
	readonly display: string;
}

const SOCIAL_LINKS: readonly SocialLink[] = [
	{ label: "GitHub", href: "https://github.com/trajan", display: "github.com/trajan" },
	{ label: "LinkedIn", href: "https://linkedin.com/in/trajan", display: "linkedin.com/in/trajan" },
	{ label: "Email", href: "mailto:trajan@place.org", display: "trajan@place.org" },
];

interface FormState {
	readonly name: string;
	readonly email: string;
	readonly message: string;
}

const EMPTY_FORM: FormState = { name: "", email: "", message: "" };

function SocialLinks() {
	return (
		<div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
			{SOCIAL_LINKS.map((link) => (
				<a
					key={link.label}
					href={link.href}
					target={link.href.startsWith("mailto") ? undefined : "_blank"}
					rel={link.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
					aria-label={link.label}
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: "0.5rem",
						padding: "0.625rem 1.25rem",
						background: "var(--place-surface-1)",
						backdropFilter: "blur(var(--glass-blur))",
						WebkitBackdropFilter: "blur(var(--glass-blur))",
						border: "1px solid var(--place-border-default)",
						borderRadius: "0.5rem",
						color: "var(--place-text-primary)",
						fontSize: "0.9375rem",
						textDecoration: "none",
						fontWeight: 500,
						transition: "border-color 0.2s ease",
					}}
				>
					<span style={{ color: "var(--place-text-secondary)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
						{link.label}
					</span>
					<span style={{ color: "var(--place-secondary-400)" }}>{link.display}</span>
				</a>
			))}
		</div>
	);
}

const inputStyle = {
	width: "100%",
	padding: "0.75rem 1rem",
	background: "rgba(10,14,26,0.8)",
	border: "1px solid var(--place-border-default)",
	borderRadius: "0.5rem",
	color: "var(--place-text-primary)",
	fontSize: "0.9375rem",
	outline: "none",
	boxSizing: "border-box" as const,
	fontFamily: "inherit",
};

function ContactForm() {
	const [form, setForm] = useState<FormState>(EMPTY_FORM);
	const [submitted, setSubmitted] = useState(false);

	function handleChange(field: keyof FormState) {
		return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			setForm((prev) => ({ ...prev, [field]: e.target.value }));
		};
	}

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		// Store in SQLite via DB worker when available; for now just show confirmation
		setSubmitted(true);
		setForm(EMPTY_FORM);
	}

	if (submitted) {
		return (
			<div
				style={{
					padding: "2rem",
					textAlign: "center",
					color: "var(--place-success)",
					fontSize: "1rem",
					fontWeight: 500,
				}}
			>
				Message received — I'll be in touch.
			</div>
		);
	}

	return (
		<form
			onSubmit={handleSubmit}
			style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
		>
			<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
				<div>
					<label
						htmlFor="contact-name"
						style={{ display: "block", fontSize: "0.75rem", color: "var(--place-text-secondary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.375rem" }}
					>
						Name
					</label>
					<input
						id="contact-name"
						type="text"
						required
						value={form.name}
						onChange={handleChange("name")}
						placeholder="Your name"
						style={inputStyle}
					/>
				</div>
				<div>
					<label
						htmlFor="contact-email"
						style={{ display: "block", fontSize: "0.75rem", color: "var(--place-text-secondary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.375rem" }}
					>
						Email
					</label>
					<input
						id="contact-email"
						type="email"
						required
						value={form.email}
						onChange={handleChange("email")}
						placeholder="you@example.com"
						style={inputStyle}
					/>
				</div>
			</div>
			<div>
				<label
					htmlFor="contact-message"
					style={{ display: "block", fontSize: "0.75rem", color: "var(--place-text-secondary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.375rem" }}
				>
					Message
				</label>
				<textarea
					id="contact-message"
					required
					rows={5}
					value={form.message}
					onChange={handleChange("message")}
					placeholder="What's on your mind?"
					style={{ ...inputStyle, resize: "vertical", minHeight: "120px" }}
				/>
			</div>
			<button
				type="submit"
				style={{
					alignSelf: "flex-start",
					padding: "0.75rem 2rem",
					background: "var(--place-secondary-400)",
					border: "none",
					borderRadius: "0.5rem",
					color: "#fff",
					fontSize: "0.9375rem",
					fontWeight: 600,
					cursor: "pointer",
					letterSpacing: "0.02em",
				}}
			>
				Send message
			</button>
		</form>
	);
}

export function ContactSection() {
	return (
		<section
			style={{
				padding: "clamp(4rem, 8vw, 8rem) clamp(1.5rem, 8vw, 8rem)",
				paddingBottom: "clamp(5rem, 10vw, 10rem)",
			}}
		>
			<ScrollReveal direction="up">
				<h2
					style={{
						fontSize: "clamp(0.75rem, 1.2vw, 0.875rem)",
						textTransform: "uppercase",
						letterSpacing: "0.2em",
						color: "var(--place-secondary-400)",
						fontWeight: 500,
						marginBottom: "2rem",
					}}
				>
					Get in touch
				</h2>
			</ScrollReveal>

			<ScrollReveal direction="up" delay={0.08}>
				<SocialLinks />
			</ScrollReveal>

			<ScrollReveal direction="up" delay={0.16}>
				<div
					style={{
						marginTop: "3rem",
						maxWidth: "680px",
						padding: "2rem",
						background: "var(--place-surface-1)",
						backdropFilter: "blur(var(--glass-blur))",
						WebkitBackdropFilter: "blur(var(--glass-blur))",
						border: "1px solid var(--place-border-default)",
						borderRadius: "0.75rem",
					}}
				>
					<h3
						style={{
							margin: "0 0 1.5rem",
							fontSize: "1.125rem",
							fontWeight: 600,
							color: "var(--place-text-primary)",
						}}
					>
						Send a message
					</h3>
					<ContactForm />
				</div>
			</ScrollReveal>
		</section>
	);
}
