const STORAGE_PREFIX = "ema:workspace:desktop:layout:";
function storageKey(projectId) {
    return `${STORAGE_PREFIX}${projectId}`;
}
export function loadLayoutArtifact(projectId) {
    if (typeof window === "undefined")
        return null;
    try {
        const raw = window.localStorage.getItem(storageKey(projectId));
        if (!raw)
            return null;
        const parsed = JSON.parse(raw);
        if (parsed.project_id !== projectId)
            return null;
        if (!Array.isArray(parsed.windows))
            return null;
        return parsed;
    }
    catch {
        return null;
    }
}
export function saveLayoutArtifact(layout) {
    if (typeof window === "undefined")
        return;
    try {
        window.localStorage.setItem(storageKey(layout.project_id), JSON.stringify(layout));
    }
    catch {
        // quota exceeded or storage disabled — drop silently; hydration on next load will be empty
    }
}
