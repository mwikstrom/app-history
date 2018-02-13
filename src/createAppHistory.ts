import { createBrowserHistory } from "history";

import {
    BlockPrompt,
    IAppHistory,
    IAppHistoryOptions,
    ILocation,
    NavigationListener,
    PUSH,
    REPLACE,
} from "./api";

import { makeNavigationFunc } from "./makeNavigationFunc";
import { isWrappedLocation } from "./isWrappedLocation";
import { Notifier } from "./Notifier";
import { unwrapLocation } from "./unwrapLocation";

export function createAppHistory(options: IAppHistoryOptions = {}): IAppHistory {
    const {
        source = createBrowserHistory(),
        cacheLimit = 20,
    } = options;

    const notifier = new Notifier(source);

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

        push: makeNavigationFunc(source, PUSH, cacheLimit),

        replace: makeNavigationFunc(source, REPLACE, cacheLimit),

        go(delta: number) { source.go(delta); },

        goBack() { source.goBack(); },

        goForward() { source.goForward(); },

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
