'use client';

import type { ReactNode } from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import { Rnd } from "react-rnd";
import { motion, AnimatePresence } from "motion/react";
import type { TargetAndTransition } from "motion/react";
import { WindowTitleBar } from "./WindowTitleBar";
import { SnapZones } from "./SnapZones";
import { useWindowStore } from "@/src/stores/window-store";
import { useSettingsStore } from "@/src/stores/settings-store";
import { APP_LABELS } from "@/src/lib/constants";
import { useSound } from "@/src/hooks/use-sound";
import { useReducedMotion } from "@/src/hooks/use-reduced-motion";
import { SPRINGS, getTransition } from "@/src/lib/springs";
import { detectSnapZone, getWindowPositionForZone } from "@/src/hooks/use-snap-zones";
import { getPopoutLauncher } from "@/src/lib/popout-launcher";
import { companionBridge } from "@/src/lib/companion-bridge";
import type { HandleClasses } from "react-rnd";
import type { ProcessWindow } from "@/src/types/window";

const RESIZE_HANDLE_CLASSES: HandleClasses = {
	bottom: 'resize-handle-glow',
	bottomLeft: 'resize-handle-glow',
	bottomRight: 'resize-handle-glow',
	left: 'resize-handle-glow',
	right: 'resize-handle-glow',
	top: 'resize-handle-glow',
	topLeft: 'resize-handle-glow',
	topRight: 'resize-handle-glow',
};

interface WindowProps {
	readonly win: ProcessWindow;
	readonly children: ReactNode;
}

const EDGE_THRESHOLD = 20;

type EdgeGlow = 'left' | 'right' | 'top' | 'bottom' | null;

function detectEdgeProximity(x: number, y: number): EdgeGlow {
	const vw = window.innerWidth;
	const vh = window.innerHeight;
	if (x < EDGE_THRESHOLD) return 'left';
	if (x > vw - EDGE_THRESHOLD) return 'right';
	if (y < EDGE_THRESHOLD) return 'top';
	if (y > vh - EDGE_THRESHOLD) return 'bottom';
	return null;
}

function isCursorOutsideViewport(x: number, y: number): boolean {
	return x < 0 || x > window.innerWidth || y < 0 || y > window.innerHeight;
}

const SHADOW_NORMAL = '0 4px 24px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.04) inset';
const SHADOW_FOCUSED = '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06), 0 1px 0 rgba(255,255,255,0.06) inset';

export function Window({ win, children }: WindowProps) {
	const { closeWindow, minimizeWindow, maximizeWindow, focusWindow, moveWindow, resizeWindow } =
		useWindowStore();
	const activeWindowId = useWindowStore((s) => s.activeWindowId);
	const shadowsEnabled = useSettingsStore((s) => s.windowShadows);
	const isFocused = win.id === activeWindowId;
	const windowShadow = shadowsEnabled
		? (isFocused ? SHADOW_FOCUSED : SHADOW_NORMAL)
		: 'none';
	const windowRadius = 'var(--place-window-radius, 12px)';
	const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
	const [edgeGlow, setEdgeGlow] = useState<EdgeGlow>(null);
	const [outsideViewport, setOutsideViewport] = useState(false);
	const { playOpen, playClose } = useSound();
	const reducedMotion = useReducedMotion();
	const lastFocusRef = useRef(0);

	// Track whether the open animation has completed so the focus pulse can
	// temporarily override the scale via `animateOverride`.
	const [animateOverride, setAnimateOverride] = useState<TargetAndTransition | null>(null);

	useEffect(() => {
		playOpen();
		return () => {
			playClose();
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const appName = APP_LABELS[win.appId];

	// Store computed minimize target so the exit animation can use it
	const [minimizeTarget, setMinimizeTarget] = useState<{ x: number; y: number } | null>(null);

	const handleMinimize = () => {
		// Calculate dock icon position before triggering the minimize.
		// The DockIcon button has className "dock-icon-btn" and aria-label matching the label.
		const dockIcon = document.querySelector(
			`button.dock-icon-btn[aria-label="${appName}"]`,
		);
		if (dockIcon) {
			const iconRect = dockIcon.getBoundingClientRect();
			const iconCenterX = iconRect.left + iconRect.width / 2;
			const iconCenterY = iconRect.top + iconRect.height / 2;
			// Offset relative to the window's current position
			const winCenterX = win.position.x + win.position.width / 2;
			const winCenterY = win.position.y + win.position.height / 2;
			setMinimizeTarget({
				x: iconCenterX - winCenterX,
				y: iconCenterY - winCenterY,
			});
		} else {
			setMinimizeTarget({ x: 0, y: 200 });
		}
		minimizeWindow(win.id);
	};
	const handleMaximize = () => maximizeWindow(win.id);
	const handleClose = () => closeWindow(win.id);

	const handleFocus = useCallback(() => {
		focusWindow(win.id);
		// Focus pulse: briefly bump scale then return to resting state
		const now = Date.now();
		if (now - lastFocusRef.current < 300) return;
		lastFocusRef.current = now;
		if (reducedMotion) return;
		setAnimateOverride({ scale: 1.01, opacity: 1 });
		const timer = setTimeout(() => setAnimateOverride(null), 200);
		return () => clearTimeout(timer);
	}, [focusWindow, win.id, reducedMotion]);

	const handleDetach = () => {
		const launcher = getPopoutLauncher();
		const popup = launcher.detach(win.id, win.appId, win.position);
		if (popup) closeWindow(win.id);
	};

	const handleDragStart = () => {
		setDragPosition(null);
		setEdgeGlow(null);
		setOutsideViewport(false);
	};

	const handleDrag = (_e: unknown, d: { x: number; y: number }) => {
		setDragPosition({ x: d.x, y: d.y });

		const outside = isCursorOutsideViewport(d.x, d.y);
		setOutsideViewport(outside);
		setEdgeGlow(outside ? null : detectEdgeProximity(d.x, d.y));
	};

	const handleDragStop = (_e: unknown, d: { x: number; y: number }) => {
		const wasOutside = outsideViewport;
		setEdgeGlow(null);
		setOutsideViewport(false);
		setDragPosition(null);

		// If released outside the viewport, pop out
		if (wasOutside || isCursorOutsideViewport(d.x, d.y)) {
			const popup = getPopoutLauncher().detach(
				win.id,
				win.appId,
				win.position,
			);
			if (popup) closeWindow(win.id);
			return;
		}

		const zone = detectSnapZone({
			x: d.x,
			y: d.y,
			viewportWidth: window.innerWidth,
			viewportHeight: window.innerHeight,
		});

		if (zone) {
			const pos = getWindowPositionForZone(
				zone,
				window.innerWidth,
				window.innerHeight,
			);
			moveWindow(win.id, pos.x, pos.y);
			resizeWindow(win.id, pos.width, pos.height);
		} else {
			moveWindow(win.id, d.x, d.y);
		}
	};

	const titleBar = (
		<WindowTitleBar
			appName={appName}
			onMinimize={handleMinimize}
			onMaximize={handleMaximize}
			onClose={handleClose}
			onDetach={handleDetach}
		/>
	);

	const openTransition = getTransition(SPRINGS.default, reducedMotion);

	// Base resting state — used as the declarative `animate` target so the
	// spring from `initial` fires automatically without needing useAnimation().
	const restingState = { scale: 1, opacity: 1 };
	// Allow the focus pulse to temporarily override the animate target
	const animateTarget = animateOverride ?? restingState;

	// Close exit: simple scale-down
	const closeExit = {
		scale: 0.95,
		opacity: 0,
		transition: reducedMotion ? { duration: 0 } : { duration: 0.2 },
	};

	// Minimize exit: genie effect — suck into the dock icon
	const minimizeExit = {
		scale: 0.05,
		opacity: 0,
		x: minimizeTarget?.x ?? 0,
		y: minimizeTarget?.y ?? 200,
		transition: reducedMotion
			? { duration: 0 }
			: getTransition(SPRINGS.default, false),
	};

	const exit = win.minimized ? minimizeExit : closeExit;

	// Maximized: fill viewport minus ambient bar (top-10 = 2.5rem) and dock (bottom-12 = 3rem)
	if (win.maximized) {
		return (
			<AnimatePresence>
				{!win.minimized && (
					<motion.div
						key={win.id}
						role="dialog"
						aria-label={appName}
						initial={{ scale: 0.96, opacity: 0 }}
						animate={animateTarget}
						exit={closeExit}
						transition={openTransition}
						onMouseDown={handleFocus}
						className="glass absolute flex flex-col overflow-hidden"
						style={{
							top: "2.5rem",
							left: 0,
							right: 0,
							bottom: "3rem",
							zIndex: win.zIndex,
							contain: "layout paint style",
							boxShadow: windowShadow,
							borderRadius: windowRadius,
							transition: "box-shadow 0.2s ease, border-radius 0.2s ease",
						}}
					>
						{titleBar}
						<div className="flex-1 overflow-auto">{children}</div>
					</motion.div>
				)}
			</AnimatePresence>
		);
	}

	return (
		<>
			<AnimatePresence>
				{!win.minimized && (
					<Rnd
						key={win.id}
						default={{
							x: win.position.x,
							y: win.position.y,
							width: win.position.width,
							height: win.position.height,
						}}
						position={{ x: win.position.x, y: win.position.y }}
						size={{ width: win.position.width, height: win.position.height }}
						onDragStart={handleDragStart}
						onDrag={handleDrag}
						onDragStop={handleDragStop}
						onResizeStop={(_e, _dir, ref, _delta, pos) => {
							resizeWindow(win.id, ref.offsetWidth, ref.offsetHeight);
							moveWindow(win.id, pos.x, pos.y);
						}}
						dragHandleClassName="drag-handle"
						resizeHandleClasses={RESIZE_HANDLE_CLASSES}
						style={{ zIndex: win.zIndex }}
						minWidth={280}
						minHeight={200}
					>
						<motion.div
							role="dialog"
							aria-label={appName}
							initial={{ scale: 0.9, opacity: 0 }}
							animate={animateTarget}
							exit={exit}
							transition={openTransition}
							onMouseDown={handleFocus}
							className="glass flex h-full w-full flex-col overflow-hidden"
							style={{
								contain: "layout paint style",
								boxShadow: windowShadow,
								borderRadius: windowRadius,
								transition: "box-shadow 0.2s ease, border-radius 0.2s ease",
							}}
						>
							{titleBar}
							<div className="flex-1 overflow-auto">{children}</div>
						</motion.div>
					</Rnd>
				)}
			</AnimatePresence>
			<SnapZones dragPosition={dragPosition} />
			<EdgeGlowOverlay edge={edgeGlow} />
			<PopoutConfirmOverlay visible={outsideViewport} companionConnected={companionBridge.isAvailable()} />
		</>
	);
}

// ---------------------------------------------------------------------------
// Edge glow overlay — faint glow on the viewport edge during drag
// ---------------------------------------------------------------------------

const GLOW_STYLES: Record<string, React.CSSProperties> = {
	left: {
		position: 'fixed', top: 0, left: 0, bottom: 0, width: 4,
		background: 'linear-gradient(to right, var(--place-primary-glow), transparent)',
		pointerEvents: 'none',
	},
	right: {
		position: 'fixed', top: 0, right: 0, bottom: 0, width: 4,
		background: 'linear-gradient(to left, var(--place-primary-glow), transparent)',
		pointerEvents: 'none',
	},
	top: {
		position: 'fixed', top: 0, left: 0, right: 0, height: 4,
		background: 'linear-gradient(to bottom, var(--place-primary-glow), transparent)',
		pointerEvents: 'none',
	},
	bottom: {
		position: 'fixed', bottom: 0, left: 0, right: 0, height: 4,
		background: 'linear-gradient(to top, var(--place-primary-glow), transparent)',
		pointerEvents: 'none',
	},
};

function EdgeGlowOverlay({ edge }: { readonly edge: EdgeGlow }) {
	if (!edge) return null;
	return <div style={{ ...GLOW_STYLES[edge], zIndex: 9998 }} />;
}

// ---------------------------------------------------------------------------
// Popout confirmation overlay — big highlight when window is dragged outside
// ---------------------------------------------------------------------------

function PopoutConfirmOverlay({ visible, companionConnected }: { readonly visible: boolean; readonly companionConnected?: boolean }) {
	return (
		<AnimatePresence>
			{visible && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.15 }}
					style={{
						position: 'fixed',
						inset: 0,
						zIndex: 9997,
						pointerEvents: 'none',
						background: 'rgba(45, 212, 168, 0.04)',
						border: '3px solid rgba(45, 212, 168, 0.3)',
						borderRadius: '0',
						boxShadow: 'inset 0 0 60px rgba(45, 212, 168, 0.08), inset 0 0 120px rgba(45, 212, 168, 0.04)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9 }}
						style={{
							background: 'rgba(10, 14, 26, 0.85)',
							border: '1px solid rgba(45, 212, 168, 0.3)',
							borderRadius: '12px',
							padding: '1rem 1.5rem',
							textAlign: 'center',
							backdropFilter: 'blur(12px)',
						}}
					>
						<div style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>
							↗
						</div>
						<div
							style={{
								fontSize: '0.8rem',
								fontWeight: 600,
								color: 'rgba(45, 212, 168, 0.9)',
							}}
						>
							{companionConnected ? 'Release to pop out as native window' : 'Release to pop out'}
						</div>
						<div
							style={{
								fontSize: '0.6rem',
								color: 'rgba(255,255,255,0.4)',
								marginTop: '0.2rem',
							}}
						>
							{companionConnected ? 'Transparent window on your desktop' : 'Opens in a separate browser window'}
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
