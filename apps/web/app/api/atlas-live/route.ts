import { getAtlasLiveState } from "@/src/lib/atlas-live";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
	const state = await getAtlasLiveState();
	return Response.json(state, {
		headers: {
			"Cache-Control": "no-store",
		},
	});
}
