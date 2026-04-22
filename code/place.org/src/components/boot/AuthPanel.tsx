'use client';

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { useAuthStore, getDevUsers } from "@/src/stores/auth-store";
import { useToastStore } from "@/src/stores/toast-store";
import type { AuthUser } from "@/src/stores/auth-store";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type AuthMode = 'login' | 'signup';

interface AuthPanelProps {
	readonly onContinue: () => void;
	readonly user: AuthUser | null;
	readonly justSignedUp: boolean;
}

// ----------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------

function WelcomeBack({
	user,
	onContinue,
	isNewUser,
}: {
	readonly user: AuthUser;
	readonly onContinue: () => void;
	readonly isNewUser: boolean;
}) {
	const logout = useAuthStore((s) => s.logout);
	const initial = user.name.charAt(0).toUpperCase();
	const lastLogin = user.lastLogin
		? new Date(user.lastLogin).toLocaleString()
		: null;

	const greeting = isNewUser
		? `Welcome, ${user.name}!`
		: `Welcome back, ${user.name}`;

	return (
		<div className="flex flex-col items-center gap-6 text-center">
			<div
				className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-semibold"
				style={{
					background: 'rgba(91, 156, 245, 0.15)',
					border: '1px solid var(--place-border-strong)',
					color: 'var(--place-secondary-400)',
				}}
			>
				{initial}
			</div>

			<div className="flex flex-col gap-1">
				<h2
					className="text-lg font-medium"
					style={{ color: 'var(--place-text-primary)' }}
				>
					{greeting}
				</h2>
				{!isNewUser && lastLogin && (
					<p
						className="text-xs"
						style={{ color: 'var(--place-text-secondary)' }}
					>
						Last login: {lastLogin}
					</p>
				)}
			</div>

			<button
				type="button"
				onClick={onContinue}
				className="cursor-pointer rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
				style={{
					background: 'var(--place-secondary-400)',
					color: '#fff',
					border: 'none',
				}}
			>
				Continue to Desktop
			</button>

			<button
				type="button"
				onClick={logout}
				className="cursor-pointer border-none bg-transparent p-0 text-xs underline"
				style={{ color: 'var(--place-text-muted)' }}
			>
				Not you? Switch account
			</button>
		</div>
	);
}

function GuestAuthPanel({
	onContinue,
}: {
	readonly onContinue: () => void;
}) {
	const [mode, setMode] = useState<AuthMode>('login');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [name, setName] = useState('');
	const [error, setError] = useState('');

	const login = useAuthStore((s) => s.login);
	const signup = useAuthStore((s) => s.signup);
	const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
	const isLoading = useAuthStore((s) => s.isLoading);
	const addToast = useToastStore((s) => s.addToast);

	const resetForm = useCallback(() => {
		setEmail('');
		setPassword('');
		setName('');
		setError('');
	}, []);

	const toggleMode = useCallback(() => {
		setMode((m) => (m === 'login' ? 'signup' : 'login'));
		resetForm();
	}, [resetForm]);

	const handleSubmit = useCallback(async () => {
		setError('');

		if (!email.trim() || !password.trim()) {
			setError('Email and password are required');
			return;
		}

		if (mode === 'signup' && !name.trim()) {
			setError('Name is required');
			return;
		}

		try {
			if (mode === 'login') {
				await login(email.trim(), password);
			} else {
				await signup(email.trim(), password, name.trim());
			}
		} catch (err: unknown) {
			const message = err instanceof Error
				? err.message
				: 'Something went wrong';
			setError(message);
		}
	}, [email, password, name, mode, login, signup]);

	const handleGoogleClick = useCallback(async () => {
		try {
			await loginWithGoogle();
		} catch {
			addToast('Google sign-in coming soon', 'info');
		}
	}, [loginWithGoogle, addToast]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter') {
				e.stopPropagation();
				void handleSubmit();
			}
		},
		[handleSubmit],
	);

	const quickLogin = useAuthStore((s) => s.quickLogin);
	const devUsers = getDevUsers();

	return (
		<div className="flex flex-col gap-5">
			{/* Quick Dev Login */}
			<div className="flex flex-col gap-2">
				<span
					className="text-xs font-medium"
					style={{ color: 'var(--place-text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}
				>
					Quick Login
				</span>
				<div className="flex gap-2">
					{devUsers.map((u) => (
						<button
							key={u.id}
							type="button"
							onClick={() => quickLogin(u.id)}
							className="flex-1 cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 hover:scale-[1.01]"
							style={{
								background: 'var(--place-primary-subtle, rgba(13,147,115,0.10))',
								border: '1px solid var(--place-primary-border, rgba(45,212,168,0.20))',
								color: 'var(--place-primary-400, #2DD4A8)',
							}}
						>
							{u.name}
						</button>
					))}
				</div>
			</div>

			{/* Guest continue */}
			<button
				type="button"
				onClick={onContinue}
				className="w-full cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-[1.01]"
				style={{
					background: 'transparent',
					border: '1px solid var(--place-border-strong)',
					color: 'var(--place-text-primary)',
				}}
			>
				Continue as Guest
			</button>

			{/* Divider */}
			<div className="flex items-center gap-3">
				<div
					className="h-px flex-1"
					style={{ background: 'var(--place-border-default)' }}
				/>
				<span
					className="text-xs"
					style={{ color: 'var(--place-text-secondary)' }}
				>
					or
				</span>
				<div
					className="h-px flex-1"
					style={{ background: 'var(--place-border-default)' }}
				/>
			</div>

			{/* Auth form */}
			<div className="flex flex-col gap-3">
				<h3
					className="text-sm font-medium"
					style={{ color: 'var(--place-text-primary)' }}
				>
					{mode === 'login' ? 'Log In' : 'Create Account'}
				</h3>

				{mode === 'signup' && (
					<input
						type="text"
						placeholder="Name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						onKeyDown={handleKeyDown}
						className="w-full rounded-md px-3 py-2 text-sm outline-none transition-colors"
						style={{
							background: 'rgba(255, 255, 255, 0.04)',
							border: '1px solid var(--place-border-default)',
							color: 'var(--place-text-primary)',
						}}
					/>
				)}

				<input
					type="email"
					placeholder="Email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					onKeyDown={handleKeyDown}
					className="w-full rounded-md px-3 py-2 text-sm outline-none transition-colors"
					style={{
						background: 'rgba(255, 255, 255, 0.04)',
						border: '1px solid var(--place-border-default)',
						color: 'var(--place-text-primary)',
					}}
				/>

				<input
					type="password"
					placeholder="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					onKeyDown={handleKeyDown}
					className="w-full rounded-md px-3 py-2 text-sm outline-none transition-colors"
					style={{
						background: 'rgba(255, 255, 255, 0.04)',
						border: '1px solid var(--place-border-default)',
						color: 'var(--place-text-primary)',
					}}
				/>

				{error && (
					<p
						className="text-xs"
						style={{ color: 'var(--place-error)' }}
					>
						{error}
					</p>
				)}

				<button
					type="button"
					onClick={() => void handleSubmit()}
					disabled={isLoading}
					className="w-full cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-[1.01] disabled:opacity-50"
					style={{
						background: 'var(--place-secondary-400)',
						color: '#fff',
						border: 'none',
					}}
				>
					{isLoading
						? 'Loading...'
						: mode === 'login'
							? 'Log In'
							: 'Sign Up'}
				</button>

				{/* Google OAuth placeholder */}
				<button
					type="button"
					onClick={() => void handleGoogleClick()}
					className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2 text-sm transition-all duration-200 hover:scale-[1.01]"
					style={{
						background: 'rgba(255, 255, 255, 0.06)',
						border: '1px solid var(--place-border-default)',
						color: 'var(--place-text-secondary)',
					}}
				>
					<GoogleIcon />
					Continue with Google
				</button>

				{/* Toggle mode */}
				<p
					className="text-center text-xs"
					style={{ color: 'var(--place-text-secondary)' }}
				>
					{mode === 'login'
						? "Don't have an account? "
						: 'Already have an account? '}
					<button
						type="button"
						onClick={toggleMode}
						className="cursor-pointer border-none bg-transparent p-0 underline"
						style={{ color: 'var(--place-secondary-400)' }}
					>
						{mode === 'login' ? 'Sign Up' : 'Log In'}
					</button>
				</p>
			</div>
		</div>
	);
}

function GoogleIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
				fill="#4285F4"
			/>
			<path
				d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
				fill="#34A853"
			/>
			<path
				d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.97 10.97 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z"
				fill="#FBBC05"
			/>
			<path
				d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
				fill="#EA4335"
			/>
		</svg>
	);
}

// ----------------------------------------------------------------------------
// Main AuthPanel
// ----------------------------------------------------------------------------

export function AuthPanel({ onContinue, user, justSignedUp }: AuthPanelProps) {
	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.6, ease: [0.65, 0.05, 0, 1] }}
			className="glass flex h-full w-full flex-col items-center justify-center rounded-2xl p-8"
			style={{
				maxWidth: '360px',
			}}
		>
			{user ? (
				<WelcomeBack user={user} onContinue={onContinue} isNewUser={justSignedUp} />
			) : (
				<GuestAuthPanel onContinue={onContinue} />
			)}
		</motion.div>
	);
}
