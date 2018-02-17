import { createBrowserHistory, createMemoryHistory } from "history";

import {
    BlockPrompt,
    IAppHistory,
    IAppHistoryOptions,
    IHistory,
    ILocation,
    IWrappedState,
    NavigationAction,
    NavigationListener,
    PathPredicate,
    PUSH,
    REPLACE,
    UnregisterCallback,
    UserConfirmation,
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

export async function createAppHistory(options: IAppHistoryOptions = {}): Promise<IAppHistory> {
    const {
        sourceType = "browser",
        getUserConfirmation,
        cacheLimit = 20,
    } = options;

    let rejectUpdate: ((reason: Error) => void) | null = null;

    const onBlocked = () => {
        if (rejectUpdate) {
            rejectUpdate(new Error("app-history: navigation was blocked"));
        }
    };

    const update = (action: () => void) => new Promise<void>((resolve, reject) => {
        if (rejectUpdate) {
            reject(new Error("app-history: concurrent navigation not supported"));
            return;
        }

        rejectUpdate = () => {
            try {
                reject();
            } finally {
                rejectUpdate = null;
            }
        };

        const unlisten = source.listen(location => {
            let willRedirect = false;

            if (!suppressor.isActive && isWrappedLocation(location)) {
                const meta = location.state.meta;
                willRedirect = meta.cut === "here";
            }

            if (!willRedirect) {
                try {
                    unlisten();
                    resolve();
                } finally {
                    rejectUpdate = null;
                }
            }
        });

        action();
    });

    const getTrackedUserConfirmation: UserConfirmation = (message, callback) => {
        const trackingCallback = (result: boolean) => {
            try {
                callback(result);
            } finally {
                if (!result) {
                    onBlocked();
                }
            }
        };

        if (getUserConfirmation) {
            getUserConfirmation(message, trackingCallback);
        } else if (sourceType === "browser") {
            trackingCallback(window.confirm(message));
        } else {
            callback(true);
        }
    };

    const source = sourceType === "memory" ?
        createMemoryHistory({ getUserConfirmation: getTrackedUserConfirmation }) :
        createBrowserHistory({ getUserConfirmation: getTrackedUserConfirmation });

    const suppressor = new Suppressor();
    const notifier = new Notifier(source, suppressor);
    const blocker = new Blocker(source, suppressor, onBlocked);

    const internalFindLast = async (
        match?: string | RegExp | PathPredicate | Partial<ILocation>,
    ): Promise<IInternalFindLastResult> => {
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
            await go(-togo);
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
            await update(() => source.goForward());
            exposedLocation = source.location;
            isAfterDirtyCut = true;
        } else {
            exposedDepth = meta.depth;
            isAfterDirtyCut = meta.cut === "before";
        }

        exposedLocation = unwrapLocation(exposedLocation);
    } else {
        try {
            await update(() => source.replace(wrapLocation(exposedLocation)));
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
                suppress(async () => {
                    if ((exposedDepth > meta.depth) || (exposedDepth === meta.depth && isAfterDirtyCut)) {
                        await source.goBack();
                    } else {
                        await source.goForward();
                    }

                    meta = initialMetaState();

                    if (isWrappedLocation(location = source.location)) {
                        meta = location.state.meta;
                    }

                    exposedDepth = meta.depth;
                    isAfterDirtyCut = meta.cut === "before";
                    exposedLocation = unwrapLocation(location);
                });
            } else {
                exposedDepth = meta.depth;
                isAfterDirtyCut = meta.cut === "before";
                exposedLocation = unwrapLocation(location);
            }
        } else {
            exposedDepth = 0;
            isAfterDirtyCut = false;
            exposedLocation = unwrapLocation(location);
        }
    });

    const canMakeCleanCut = () => {
        let ok = false;

        if (isWrappedLocation(source.location)) {
            const meta = source.location.state.meta;
            ok = meta.depth > 0 || meta.cut === "before";
        }

        return ok;
    };

    const makeCleanCut = async () => {
        const curr = {
            ...source.location,
            key: undefined,
        };
        await goBack();
        await update(() => source.push(curr));
    };

    const createDirtyCut = (
        curr: ILocation<IWrappedState>,
        how: "before" | "here",
    ): ILocation<IWrappedState> => ({
        ...curr,
        key: undefined,
        state: {
            ...curr.state,
            meta: {
                ...curr.state.meta,
                cut: how,
            },
        },
    });

    const makeDirtyCut = async () => {
        const curr = isWrappedLocation(source.location) ? source.location : wrapLocation(source.location);
        const next = createDirtyCut(curr, "before");
        const prev = createDirtyCut(curr, "here");
        await update(() => source.replace(prev));
        await update(() => source.push(next));
        isAfterDirtyCut = true;
    };

    const cut = () => suppress(async () => {
        if (canMakeCleanCut()) {
            await makeCleanCut();
        } else {
            await makeDirtyCut();
        }
    });

    const block = (prompt?: boolean | string | BlockPrompt) => blocker.block(prompt);

    const createHref = (location: Partial<ILocation>) => source.createHref(location);

    const distanceToHome = () => isWrappedLocation(source.location) ? -source.location.state.meta.depth : 0;

    const findLast = async (match: string | RegExp | PathPredicate): Promise<number> => {
        const result = await internalFindLast(match);

        if (result.undo !== 0) {
            await go(result.undo);
            result.delta -= result.undo;
        }

        if (result.resume) {
            result.resume();
        }

        return result.delta;
    };

    const go = (delta: number) => update(() => source.go(delta));

    async function goBack(to?: RegExp | PathPredicate): Promise<boolean>;
    async function goBack(to: string, state?: any): Promise<boolean>;
    async function goBack(to?: Partial<ILocation>): Promise<boolean>;
    async function goBack(
        to?: string | Partial<ILocation> | RegExp | PathPredicate,
        state?: any,
    ): Promise<boolean> {
        const conditional = to instanceof RegExp || typeof to === "function";

        if (typeof to === "object" && !(to instanceof RegExp)) {
            state = to.state;
        }

        const found = await internalFindLast(to);
        let willReplace = typeof state !== "undefined";
        let forcePath: string | null = null;

        if (isNaN(found.delta)) {
            if (conditional) {
                if (found.undo) {
                    await go(found.undo);
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

        await go(found.delta);

        if (willReplace) {
            found.resume!();

            if (typeof forcePath === "string") {
                await replace(forcePath, state);
            } else {
                await replace({
                    ...source.location,
                    state,
                });
            }
        }

        return true;
    }

    const goForward = () => update(() => source.goForward());

    const goHome = async (
        to?: string | Partial<ILocation>,
        state?: any,
    ) => {
        const delta = distanceToHome();

        if (delta !== 0) {
            let resume: UnregisterCallback | null = null;

            try {
                if (typeof to !== "undefined") {
                    resume = suppressor.suppress();
                }

                await go(delta);
            } finally {
                if (resume) {
                    resume();
                }
            }
        }

        if (typeof to !== "undefined") {
            await replace(to, state);
        }
    };

    const listen = (listener: NavigationListener) => notifier.listen(listener);

    const push = (
        pathOrDescriptor: string | Partial<ILocation>,
        state?: any,
    ) => update(() => {
        if (typeof pathOrDescriptor === "string") {
            source.push(pathOrDescriptor, nextState(source, PUSH, state, cacheLimit));
        } else {
            source.push(nextLocation(source, PUSH, pathOrDescriptor, cacheLimit));
        }
    });

    const replace = (
        pathOrDescriptor: string | Partial<ILocation>,
        state?: any,
    ) => update(() => {
        if (typeof pathOrDescriptor === "string") {
            source.replace(pathOrDescriptor, nextState(source, REPLACE, state, cacheLimit));
        } else {
            source.replace(nextLocation(source, REPLACE, pathOrDescriptor, cacheLimit));
        }
    });

    function suppress(): UnregisterCallback;
    function suppress(action: WithSuppressionAction): Promise<void>;
    function suppress(action?: WithSuppressionAction): UnregisterCallback | Promise<void> {
        if (typeof action === "undefined") {
            return suppressor.suppress();
        } else {
            const resume = suppressor.suppress();
            let promise: Promise<void> | null = null;
            return new Promise<void>((resolve, reject) => {
                try {
                    const result = action(history);
                    if (result instanceof Promise) {
                        promise = result;
                    }
                } finally {
                    if (promise === null) {
                        resume();
                    }
                }

                if (promise === null) {
                    resolve();
                } else {
                    promise.then(
                        () => {
                            resume();
                            resolve();
                        },
                        () => {
                            resume();
                            reject();
                        },
                    );
                }
            });
        }
    }

    const history: IAppHistory = {
        get cacheLimit() { return cacheLimit; },
        get depth(): number { return exposedDepth; },
        get isSuppressed(): boolean { return suppressor.isActive; },
        get length(): number { return source.length; },
        get action(): NavigationAction { return exposedAction; },
        get location(): ILocation { return exposedLocation; },
        get source(): IHistory { return source; },

        block,
        createHref,
        cut,
        findLast,
        go,
        goBack,
        goForward,
        goHome,
        listen,
        push,
        replace,
        suppress,
    };

    Object.freeze(history);
    return history;
}
