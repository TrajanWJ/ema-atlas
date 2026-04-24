import { useReducer, useCallback, useMemo, useEffect } from "react";
import { loadLayoutArtifact, saveLayoutArtifact } from "./layout-artifact";
const DEFAULT_WINDOW_SIZE = { width: 960, height: 640 };
function reducer(state, action) {
    switch (action.type) {
        case "hydrate": {
            const maxZ = action.layout.windows.reduce((m, w) => Math.max(m, w.z), 0);
            return {
                projectId: action.layout.project_id,
                windows: action.layout.windows,
                nextZ: maxZ + 1,
            };
        }
        case "open": {
            const existing = state.windows.find((w) => w.id === action.window.id);
            if (existing) {
                return {
                    ...state,
                    windows: state.windows.map((w) => w.id === action.window.id ? { ...w, z: state.nextZ, minimized: false } : w),
                    nextZ: state.nextZ + 1,
                };
            }
            const newWindow = {
                ...action.window,
                z: state.nextZ,
                minimized: action.window.minimized ?? false,
            };
            return {
                ...state,
                windows: [...state.windows, newWindow],
                nextZ: state.nextZ + 1,
            };
        }
        case "close": {
            return { ...state, windows: state.windows.filter((w) => w.id !== action.id) };
        }
        case "focus": {
            return {
                ...state,
                windows: state.windows.map((w) => w.id === action.id ? { ...w, z: state.nextZ, minimized: false } : w),
                nextZ: state.nextZ + 1,
            };
        }
        case "move": {
            return {
                ...state,
                windows: state.windows.map((w) => w.id === action.id ? { ...w, x: action.x, y: action.y } : w),
            };
        }
        case "resize": {
            return {
                ...state,
                windows: state.windows.map((w) => w.id === action.id ? { ...w, width: action.width, height: action.height } : w),
            };
        }
        case "minimize": {
            return {
                ...state,
                windows: state.windows.map((w) => w.id === action.id ? { ...w, minimized: action.minimized } : w),
            };
        }
    }
}
export function useWindowStore(projectId) {
    const [state, dispatch] = useReducer(reducer, {
        projectId,
        windows: [],
        nextZ: 1,
    });
    useEffect(() => {
        const layout = loadLayoutArtifact(projectId);
        if (layout)
            dispatch({ type: "hydrate", layout });
    }, [projectId]);
    useEffect(() => {
        saveLayoutArtifact({
            project_id: state.projectId,
            windows: state.windows,
            wallpaper_key: "scene-default",
            updated_at: new Date().toISOString(),
        });
    }, [state]);
    const openWindow = useCallback((input) => {
        const id = `window:${input.vapp}`;
        const offset = state.windows.length * 32;
        dispatch({
            type: "open",
            window: {
                id,
                vapp: input.vapp,
                title: input.title,
                route: input.route,
                x: input.defaultGeometry?.x ?? 80 + offset,
                y: input.defaultGeometry?.y ?? 80 + offset,
                width: input.defaultGeometry?.width ?? DEFAULT_WINDOW_SIZE.width,
                height: input.defaultGeometry?.height ?? DEFAULT_WINDOW_SIZE.height,
            },
        });
        return id;
    }, [state.windows.length]);
    const closeWindow = useCallback((id) => dispatch({ type: "close", id }), []);
    const focusWindow = useCallback((id) => dispatch({ type: "focus", id }), []);
    const moveWindow = useCallback((id, x, y) => dispatch({ type: "move", id, x, y }), []);
    const resizeWindow = useCallback((id, width, height) => dispatch({ type: "resize", id, width, height }), []);
    const minimizeWindow = useCallback((id, minimized) => dispatch({ type: "minimize", id, minimized }), []);
    return useMemo(() => ({
        windows: state.windows,
        openWindow,
        closeWindow,
        focusWindow,
        moveWindow,
        resizeWindow,
        minimizeWindow,
    }), [state.windows, openWindow, closeWindow, focusWindow, moveWindow, resizeWindow, minimizeWindow]);
}
