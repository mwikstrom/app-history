import { createBrowserHistory } from "history";

import {
    BlockPrompt,
    IAppHistory,
    IAppHistoryOptions,
    ILocation,
    NavigationAction,
    NavigationListener,
    PathPredicate,
    PUSH,
    REPLACE,
    UnregisterCallback,
    WithSuppressionAction,
} from "./api";

import { Blocker } from "./Blocker";
import { isWrappedLocation } from "./isWrappedLocation";
import { makeNavigationFunc } from "./makeNavigationFunc";
import { Notifier } from "./Notifier";
import { Suppressor } from "./Suppressor";
import { unwrapLocation } from "./unwrapLocation";

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

    const history: IAppHistory = {
        get cacheLimit(): number {
            return cacheLimit;
        },

        get depth(): number {
            if (isWrappedLocation(source.location)) {
                return source.location.state.meta.depth;
            } else {
                return 0;
            }
        },

        get isSuppressed(): boolean {
            return suppressor.isActive;
        },

        get length(): number {
            return source.length;
        },

        get action(): NavigationAction {
            return source.action;
        },

        get location(): ILocation {
            return unwrapLocation(source.location);
        },

        push,

        replace,

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
