import { createBrowserHistory } from "history";

import {
    BlockPrompt,
    IAppHistory,
    IAppHistoryOptions,
    ILocation,
    IWrappedState,
    NavigationAction,
    NavigationListener,
    PathPredicate,
    PUSH,
    REPLACE,
    UnregisterCallback,
    WithSuppressionAction,
} from "./api";

import { Blocker } from "./Blocker";
import { initialMetaState } from "./initialMetaState";
import { isWrappedLocation } from "./isWrappedLocation";
import { makeNavigationFunc } from "./makeNavigationFunc";
import { Notifier } from "./Notifier";
import { Suppressor } from "./Suppressor";
import { unwrapLocation } from "./unwrapLocation";
import { wrapLocation } from "./wrapLocation";

interface IInternalFindLastResult {
    delta: number;
    resume: UnregisterCallback | null;
    undo: number;
}

export function createAppHistory(options: IAppHistoryOptions = {}): IAppHistory {
    const {
        source = createBrowserHistory(),
        cacheLimit = 20,
    } = options;

    const suppressor = new Suppressor();
    const notifier = new Notifier(source, suppressor);
    const blocker = new Blocker(source, suppressor);

    const push = makeNavigationFunc(source, PUSH, cacheLimit);
    const replace = makeNavigationFunc(source, REPLACE, cacheLimit);

    const internalFindLast = (
        match: string | RegExp | PathPredicate,
    ): IInternalFindLastResult => {
        const predicate: PathPredicate =
            typeof match === "string" ? path => path === match :
            typeof match === "function" ? match :
            match.test.bind(match);

        const result: IInternalFindLastResult = {
            delta: 0,
            resume: null,
            undo: 0,
        };

        while (true) {
            if (predicate(source.createHref(source.location))) {
                return result;
            }

            if (!isWrappedLocation(source.location)) {
                break;
            }

            const { cache, depth } = source.location.state.meta;

            for (let index = cache.length - 1; index >= 0; --index) {
                --result.delta;

                if (predicate(cache[index])) {
                    return result;
                }
            }

            if (depth <= cache.length) {
                break;
            }

            if (!result.resume) {
                result.resume = suppressor.suppress();
            }

            const togo = cache.length + 1;
            --result.delta;
            result.undo += togo;
            source.go(-togo);
        }

        result.delta = NaN;
        return result;
    };

    let exposedLocation = source.location;
    let exposedAction = source.action as NavigationAction;
    let exposedDepth = 0;
    let isAfterDirtyCut = false;

    if (isWrappedLocation(exposedLocation)) {
        const meta = exposedLocation.state.meta;

        if (meta.cut === "here") {
            source.goForward();
            exposedLocation = source.location;
            isAfterDirtyCut = true;
        } else {
            exposedDepth = meta.depth;
            isAfterDirtyCut = meta.cut === "before";
        }

        exposedLocation = unwrapLocation(exposedLocation);
    } else {
        try {
            source.replace(wrapLocation(exposedLocation));
        } catch (ignored) { /* don't choke on init */ }
    }

    source.listen((location, action) => {
        if (suppressor.isActive) {
            return;
        }

        exposedAction = action;

        if (isWrappedLocation(location)) {
            let meta = location.state.meta;

            if (meta.cut === "here") {
                const resume = suppressor.suppress();

                try {
                    if ((exposedDepth > meta.depth) || (exposedDepth === meta.depth && isAfterDirtyCut)) {
                        source.goBack();
                    } else {
                        source.goForward();
                    }
                } finally {
                    resume();
                }

                meta = initialMetaState();

                if (isWrappedLocation(location = source.location)) {
                    meta = location.state.meta;
                }
            }

            exposedDepth = meta.depth;
            isAfterDirtyCut = meta.cut === "before";
        } else {
            exposedDepth = 0;
            isAfterDirtyCut = false;
        }

        exposedLocation = unwrapLocation(location);
    });

    const canMakeCleanCut = () => {
        let ok = false;

        if (isWrappedLocation(source.location)) {
            const { depth, cut } = source.location.state.meta;
            ok = depth > 0 || cut === "before";
        }

        return ok;
    };

    const makeCleanCut = () => {
        const curr = source.location;
        source.goBack();
        source.push(curr);
    };

    const createDirtyCut = (
        curr: ILocation<IWrappedState>,
        cut: "before" | "here",
    ): ILocation<IWrappedState> => ({
        ...curr,
        state: {
            ...curr.state,
            meta: {
                ...curr.state.meta,
                cut,
            },
        },
    });

    const makeDirtyCut = () => {
        const curr = isWrappedLocation(source.location) ? source.location : wrapLocation(source.location);
        const next = createDirtyCut(curr, "before");
        const prev = createDirtyCut(curr, "here");
        source.replace(prev);
        source.push(next);
        isAfterDirtyCut = true;
    };

    const history: IAppHistory = {
        get cacheLimit(): number {
            return cacheLimit;
        },

        get depth(): number {
            return exposedDepth;
        },

        get isSuppressed(): boolean {
            return suppressor.isActive;
        },

        get length(): number {
            return source.length;
        },

        get action(): NavigationAction {
            return exposedAction;
        },

        get location(): ILocation {
            return exposedLocation;
        },

        push,

        replace,

        cut(): void {
            const resume = suppressor.suppress();
            try {
                if (canMakeCleanCut()) {
                    makeCleanCut();
                } else {
                    makeDirtyCut();
                }
            } finally {
                resume();
            }
        },

        block(prompt?: boolean | string | BlockPrompt): UnregisterCallback {
            return blocker.block(prompt);
        },

        createHref(location: Partial<ILocation>): string {
            return source.createHref(location);
        },

        findLast(match: string | RegExp | PathPredicate): number {
            const result = internalFindLast(match);

            if (result.undo !== 0) {
                source.go(result.undo);
            }

            if (result.resume) {
                result.resume();
            }

            return result.delta;
        },

        go(delta: number): void {
            source.go(delta);
        },

        goBack(): void {
            source.goBack();
        },

        goForward(): void {
            source.goForward();
        },

        goHome(to?: string | Partial<ILocation>, state?: any) {
            if (isWrappedLocation(source.location)) {
                const meta = source.location.state.meta;
                if (meta.depth > 0) {
                    let resume: UnregisterCallback | null = null;

                    try {
                        if (typeof to !== "undefined") {
                            resume = suppressor.suppress();
                        }

                        source.go(-meta.depth);
                    } finally {
                        if (resume) {
                            resume();
                        }
                    }
                }
            }

            if (typeof to !== "undefined") {
                replace(to, state);
            }
        },

        listen(listener: NavigationListener): UnregisterCallback {
            return notifier.listen(listener);
        },

        suppress(action?: WithSuppressionAction): UnregisterCallback {
            if (typeof action === "undefined") {
                return suppressor.suppress();
            } else {
                const resume = suppressor.suppress();
                try {
                    action(history);
                } finally {
                    resume();
                }
                return resume;
            }
        },
    };

    Object.freeze(history);
    return history;
}
