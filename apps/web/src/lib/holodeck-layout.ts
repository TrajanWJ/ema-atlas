export const HOLODECK_CONTENT_INSET = 88;

export function holodeckInsetStyle() {
	return {
		marginLeft: HOLODECK_CONTENT_INSET,
		width: `calc(100dvw - ${HOLODECK_CONTENT_INSET}px)`,
	} as const;
}
