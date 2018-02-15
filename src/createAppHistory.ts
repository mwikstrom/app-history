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
import { nextLocation } from "./nextLocation";
import { nextState } from "./nextState";
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

    const internalFindLast = (
        match?: string | RegExp | PathPredicate | Partial<ILocation>,
    ): IInternalFindLastResult => {
        const result: IInternalFindLastResult = {
            delta: 0,
            resume: null,
            undo: 0,
        };

        if (typeof match === "undefined") {
            result.delta = -1;
            return result;
        }

        if (typeof match === "object" && !(match instanceof RegExp)) {
            match = source.createHref(match);
        }

        const predicate: PathPredicate =
            typeof match === "string" ? path => path === match :
            typeof match === "function" ? match :
            match.test.bind(match);

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
            result.delta += cache.length;
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

    const push = (
        pathOrDescriptor: string | Partial<ILocation>,
        state?: any,
    ): IAppHistory => {
        if (typeof pathOrDescriptor === "string") {
            source.push(pathOrDescriptor, nextState(source, PUSH, state, cacheLimit));
        } else {
            source.push(nextLocation(source, PUSH, pathOrDescriptor, cacheLimit));
        }

        return history;
    };

    const replace = (
        pathOrDescriptor: string | Partial<ILocation>,
        state?: any,
    ): IAppHistory => {
        if (typeof pathOrDescriptor === "string") {
            source.replace(pathOrDescriptor, nextState(source, REPLACE, state, cacheLimit));
        } else {
            source.replace(nextLocation(source, REPLACE, pathOrDescriptor, cacheLimit));
        }

        return history;
    };

    function suppress(): UnregisterCallback;
    function suppress(action: WithSuppressionAction): IAppHistory;
    function suppress(action?: WithSuppressionAction): UnregisterCallback | IAppHistory {
        if (typeof action === "undefined") {
            return suppressor.suppress();
        } else {
            const resume = suppressor.suppress();
            try {
                action(history);
            } finally {
                resume();
            }
            return history;
        }
    }

    const distanceToHome = () =>
        isWrappedLocation(source.location) ? -source.location.state.meta.depth : 0;

    function goBack(to?: RegExp | PathPredicate): boolean;
    function goBack(to: string, state?: any): IAppHistory;
    function goBack(to?: Partial<ILocation>): IAppHistory;
    function goBack(
        to?: string | Partial<ILocation> | RegExp | PathPredicate,
        state?: any,
    ): IAppHistory | boolean {
        const isFuzzy = to instanceof RegExp || typeof to === "function";

        if (typeof to === "object" && !(to instanceof RegExp)) {
            state = to.state;
        }

        const found = internalFindLast(to);
        let willReplace = typeof state !== "undefined";
        let forcePath: string | null = null;

        if (isNaN(found.delta)) {
            if (isFuzzy) {
                if (found.undo) {
                    source.go(found.undo);
                }

                if (found.resume) {
                    found.resume();
                }

                return false;
            }

            found.delta = distanceToHome();
            willReplace = true;
            forcePath = typeof to === "string" ? to : source.createHref(to as Partial<ILocation>);
        }

        if (found.resume && !willReplace) {
            found.resume();
        } else if (!found.resume && willReplace) {
            found.resume = suppressor.suppress();
        }

        source.go(found.delta);

        if (willReplace) {
            found.resume!();

            if (typeof forcePath === "string") {
                source.replace(forcePath, state);
            } else {
                source.replace({
                    ...source.location,
                    state,
                });
            }
        }

        return isFuzzy ? true : history;
    }

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

        cut(): IAppHistory {
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

            return history;
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
                result.delta -= result.undo;
            }

            if (result.resume) {
                result.resume();
            }

            return result.delta;
        },

        go(delta: number): IAppHistory {
            source.go(delta);
            return history;
        },

        goBack,

        goForward(): IAppHistory {
            source.goForward();
            return history;
        },

        goHome(
            to?: string | Partial<ILocation>,
            state?: any,
        ): IAppHistory {
            const delta = distanceToHome();

            if (delta !== 0) {
                let resume: UnregisterCallback | null = null;

                try {
                    if (typeof to !== "undefined") {
                        resume = suppressor.suppress();
                    }

                    source.go(delta);
                } finally {
                    if (resume) {
                        resume();
                    }
                }
            }

            if (typeof to !== "undefined") {
                replace(to, state);
            }

            return history;
        },

        listen(listener: NavigationListener): UnregisterCallback {
            return notifier.listen(listener);
        },

        push,

        replace,

        suppress,
    };

    Object.freeze(history);
    return history;
}
