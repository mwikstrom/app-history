import { createBrowserHistory, createMemoryHistory } from "history";

import { IHistory, IHistoryProvider, SourceMode, UserConfirmation } from "./api";
import { makeUserConfirmation } from "./makeUserConfirmation";

export function createSource(
    onChangeWasBlocked: () => void,
    mode: SourceMode,
    getUserConfirmation: UserConfirmation = makeUserConfirmation(mode),
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

    let factoryFunc = mode === "memory" ?
        provider.createMemoryHistory : provider.createBrowserHistory;

    if (!factoryFunc) {
        throw new Error("app-history: Provider does not support " + mode + " history");
    }

    factoryFunc = factoryFunc.bind(provider);

    return factoryFunc!({ getUserConfirmation: getTrackedUserConfirmation });
}
