import { IHistory, IMetaState, NavigationAction, POP, PUSH } from "./api";
import { initialMetaState } from "./initialMetaState";
import { isWrappedLocation } from "./isWrappedLocation";

export function nextMetaState(
    source: IHistory,
    action: NavigationAction,
    cacheLimit: number,
): IMetaState {
    const next = nextMetaCore(source, action);
    applyCacheLimit(next, cacheLimit);
    return next;
}

function nextMetaCore(
    source: IHistory,
    action: NavigationAction,
): IMetaState {
    const location = source.location;
    const path = source.createHref(location);
    const meta = isWrappedLocation(location) ? location.state.meta : initialMetaState();

    switch (action) {
        case PUSH: return afterPush(meta, path);
        case POP: return afterPop(meta);
        default: return afterReplace(meta, path);
    }
}

function applyCacheLimit(meta: IMetaState, limit: number) {
    if (meta.cache.length > limit && limit >= 0) {
        const deleteCount = meta.cache.length - limit;
        meta.cache.splice(0, deleteCount);
    }
}

function afterPush(meta: IMetaState, path: string): IMetaState {
    return {
        cache: meta.cache.concat(path),
        depth: meta.depth + 1,
    };
}

function afterPop(meta: IMetaState): IMetaState {
    return {
        cache: meta.cache.slice(0, -1),
        depth: Math.max(0, meta.depth - 1),
    };
}

function afterReplace(meta: IMetaState, path: string): IMetaState {
    if (meta.depth > 0) {
        return {
            cache: meta.cache.slice(0, -1).concat(path),
            depth: meta.depth,
        };
    } else {
        return meta;
    }
}
