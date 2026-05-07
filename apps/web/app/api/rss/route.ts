export async function GET(request: Request) {
	const url = new URL(request.url);
	const feedUrl = url.searchParams.get("url");
	const softFail = url.searchParams.get("soft") === "1";

	if (!feedUrl) {
		return Response.json({ error: "Missing url parameter" }, { status: 400 });
	}
	const requestedFeedUrl = feedUrl;

	// Basic URL validation
	let parsed: URL;
	try {
		parsed = new URL(requestedFeedUrl);
	} catch {
		return Response.json({ error: "Invalid URL" }, { status: 400 });
	}

	if (!["http:", "https:"].includes(parsed.protocol)) {
		return Response.json({ error: "Invalid protocol" }, { status: 400 });
	}

	function unavailableFeed(reason: string): Response {
		if (!softFail) {
			return Response.json({ error: reason }, { status: 502 });
		}

		const escapedUrl = escapeXml(requestedFeedUrl);
		const escapedTitle = escapeXml(`${parsed.hostname} unavailable`);
		const escapedReason = escapeXml(reason);
		return new Response(
			`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapedTitle}</title>
    <link>${escapedUrl}</link>
    <description>${escapedReason}</description>
  </channel>
</rss>`,
			{
				headers: {
					"Content-Type": "application/xml; charset=utf-8",
					"Cache-Control": "no-store",
					"X-EMA-RSS-Degraded": "upstream-unavailable",
				},
			},
		);
	}

	try {
		const response = await fetch(requestedFeedUrl, {
			headers: { "User-Agent": "place.org RSS Reader" },
			signal: AbortSignal.timeout(10_000),
		});

		if (!response.ok) {
			return unavailableFeed(`Upstream returned ${response.status}`);
		}

		const text = await response.text();
		return new Response(text, {
			headers: {
				"Content-Type": "application/xml; charset=utf-8",
				"Cache-Control": "public, max-age=300",
			},
		});
	} catch {
		return unavailableFeed("Failed to fetch feed");
	}
}

function escapeXml(value: string): string {
	return value.replace(/[<>&'"]/g, (char) => {
		switch (char) {
			case "<":
				return "&lt;";
			case ">":
				return "&gt;";
			case "&":
				return "&amp;";
			case "'":
				return "&apos;";
			case '"':
				return "&quot;";
			default:
				return char;
		}
	});
}
