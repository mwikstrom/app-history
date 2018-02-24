import { createBrowserHistory, createMemoryHistory } from "history";

import { IHistory, IHistoryProvider, SourceMode, UserConfirmation } from "./api";

const defaultUserConfirmation: UserConfirmation = (message, callback) => {
    callback(window.confirm(message));
};

const noUserConfirmation: UserConfirmation = (_, callback) => {
    callback(true);
};

const makeDefaultUserConfirmation = (mode: SourceMode) =>
    mode === "browser" ? defaultUserConfirmation : noUserConfirmation;

export function createSource(
    onChangeWasBlocked: () => void,
    mode: SourceMode,
    getUserConfirmation: UserConfirmation = makeDefaultUserConfirmation(mode),
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

        getUserConfirmation(message, trackingCallback);
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
        throw new Error("app-history: Provider does not support " + mode + " history");
    }

    if (provider) {
        factoryFunc.bind(provider);
    }

    return factoryFunc({ getUserConfirmation: getTrackedUserConfirmation });
}
