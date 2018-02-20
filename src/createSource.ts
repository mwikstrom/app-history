import { createBrowserHistory, createMemoryHistory } from "history";

import { IHistory, IHistoryProvider, SourceMode, UserConfirmation } from "./api";

export function createSource(
    onChangeWasBlocked: () => void,
    mode: SourceMode,
    getUserConfirmation?: UserConfirmation,
    provider?: IHistoryProvider,
): IHistory {
    const getTrackedUserConfirmation: UserConfirmation = (message, callback) => {
        const trackingCallback = (result: boolean) => {
            try {
                callback(result);
            } finally {
                if (!result) {
                    onChangeWasBlocked();
                }
            }
        };

        if (getUserConfirmation) {
            getUserConfirmation(message, trackingCallback);
        } else if (mode === "browser") {
            trackingCallback(window.confirm(message));
        } else {
            callback(true);
        }
    };

    if (!provider) {
        provider = {
            createBrowserHistory,
            createMemoryHistory,
        };
    }

    const factoryFunc = mode === "memory" ?
        provider.createMemoryHistory : provider.createBrowserHistory;

    if (!factoryFunc) {
        throw new Error("app-history: Missing provider for " + mode + " history");
    }

    if (provider) {
        factoryFunc.bind(provider);
    }

    return factoryFunc({ getUserConfirmation: getTrackedUserConfirmation });
}
