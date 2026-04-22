export async function GET(request: Request) {
	const url = new URL(request.url);
	const feedUrl = url.searchParams.get("url");

	if (!feedUrl) {
		return Response.json({ error: "Missing url parameter" }, { status: 400 });
	}

	// Basic URL validation
	let parsed: URL;
	try {
		parsed = new URL(feedUrl);
	} catch {
		return Response.json({ error: "Invalid URL" }, { status: 400 });
	}

	if (!["http:", "https:"].includes(parsed.protocol)) {
		return Response.json({ error: "Invalid protocol" }, { status: 400 });
	}

	try {
		const response = await fetch(feedUrl, {
			headers: { "User-Agent": "place.org RSS Reader" },
			signal: AbortSignal.timeout(10_000),
		});

		if (!response.ok) {
			return Response.json(
				{ error: `Upstream returned ${response.status}` },
				{ status: 502 },
			);
		}

		const text = await response.text();
		return new Response(text, {
			headers: {
				"Content-Type": "application/xml; charset=utf-8",
				"Cache-Control": "public, max-age=300",
			},
		});
	} catch {
		return Response.json({ error: "Failed to fetch feed" }, { status: 500 });
	}
}
