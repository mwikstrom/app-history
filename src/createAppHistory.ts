import { createBrowserHistory } from "history";

import {
    BlockPrompt,
    IAppHistory,
    IAppHistoryOptions,
    ILocation,
    NavigationListener,
    PUSH,
    REPLACE,
    UnregisterCallback,
} from "./api";

import { isWrappedLocation } from "./isWrappedLocation";
import { makeNavigationFunc } from "./makeNavigationFunc";
import { Notifier } from "./Notifier";
import { unwrapLocation } from "./unwrapLocation";

export function createAppHistory(options: IAppHistoryOptions = {}): IAppHistory {
    const {
        source = createBrowserHistory(),
        cacheLimit = 20,
    } = options;

    const notifier = new Notifier(source);

    const push = makeNavigationFunc(source, PUSH, cacheLimit);
    const replace = makeNavigationFunc(source, REPLACE, cacheLimit);

    const suppress = () => notifier.suppress();

    const history: IAppHistory = {
        get cacheLimit() { return cacheLimit; },

        get depth() {
            if (isWrappedLocation(source.location)) {
                return source.location.state.meta.depth;
            } else {
                return 0;
            }
        },

        get length() { return source.length; },

        get action() { return source.action; },

        get location() { return unwrapLocation(source.location); },

        push,

        replace,

        go(delta: number) { source.go(delta); },

        goBack() { source.goBack(); },

        goForward() { source.goForward(); },

        goHome(pathOrLocation?: string | Partial<ILocation>, state?: any) {
            if (isWrappedLocation(source.location)) {
                const meta = source.location.state.meta;
                if (meta.depth > 0) {
                    let resume: UnregisterCallback | null = null;

                    try {
                        if (typeof pathOrLocation !== "undefined") {
                            resume = suppress();
                        }

                        source.go(-meta.depth);
                    } finally {
                        if (resume) {
                            resume();
                        }
                    }
                }
            }

            if (typeof pathOrLocation !== "undefined") {
                replace(pathOrLocation, state);
            }
        },

        block(prompt?: boolean | string | BlockPrompt) {
            return source.block(prompt);
        },

        listen(listener: NavigationListener) {
            return notifier.listen(listener);
        },

        createHref(location: Partial<ILocation>): string {
            return source.createHref(location);
        },
    };

    Object.freeze(history);
    return history;
}
