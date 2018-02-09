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

import { createNavigation } from "./createNavigation";
import { isWrappedLocation } from "./isWrappedLocation";
import { Notifier } from "./Notifier";
import { unwrapLocation } from "./unwrapLocation";
import { wrapLocation } from "./wrapLocation";

export function createAppHistory(options: IAppHistoryOptions = {}): IAppHistory {
    const {
        source = createBrowserHistory(),
        cacheLimit = 10,
    } = options;

    if (!isWrappedLocation(source.location)) {
        source.replace(wrapLocation(source.location));
    }

    const notifier = new Notifier(source);

    const history: IAppHistory = {
        get length() { return source.length; },

        get action() { return source.action; },

        get location() { return unwrapLocation(source.location); },

        push: createNavigation(source, PUSH, cacheLimit),

        replace: createNavigation(source, REPLACE, cacheLimit),

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
