/**
 * Favicon badge system
 * Adds a number badge to the favicon using Canvas API
 */

// Store original favicon for restoration
let originalFavicon: string | null = null;

/**
 * Creates a canvas-based favicon with a badge
 */
function createBadgedFavicon(count: number): string {
	const canvas = document.createElement("canvas");
	canvas.width = 32;
	canvas.height = 32;

	const ctx = canvas.getContext("2d");
	if (!ctx) return "";

	// Fill with background (light color for visibility)
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, 32, 32);

	// Draw base letter "P" (represents place.org)
	ctx.fillStyle = "#000000";
	ctx.font = "bold 20px system-ui";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText("P", 16, 14);

	// Draw red badge circle in bottom right
	const badgeRadius = 10;
	const badgeX = 24;
	const badgeY = 24;

	ctx.fillStyle = "#ef4444"; // red
	ctx.beginPath();
	ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
	ctx.fill();

	// Draw badge number
	ctx.fillStyle = "#ffffff";
	ctx.font = "bold 10px system-ui";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	const numberText = count > 99 ? "99+" : String(count);
	ctx.fillText(numberText, badgeX, badgeY);

	return canvas.toDataURL("image/png");
}

/**
 * Set a number badge on the favicon
 * If count is 0 or less, clears the badge
 */
export function setFaviconBadge(count: number): void {
	// Get or store original favicon link
	let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');

	if (!link) {
		link = document.createElement("link");
		link.rel = "icon";
		document.head.appendChild(link);
	}

	// Store original only on first call
	if (!originalFavicon) {
		originalFavicon = link.href;
	}

	if (count <= 0) {
		// Restore original favicon
		if (originalFavicon) {
			link.href = originalFavicon;
		}
	} else {
		// Set badged favicon
		const badgedUrl = createBadgedFavicon(count);
		link.href = badgedUrl;
	}
}

/**
 * Clear the favicon badge and restore original
 */
export function clearFaviconBadge(): void {
	setFaviconBadge(0);
}
