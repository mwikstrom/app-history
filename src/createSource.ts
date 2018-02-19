import { createBrowserHistory, createMemoryHistory } from "history";

import { IHistory, SourceType, UserConfirmation } from "./api";

export function createSource(
    onChangeWasBlocked: () => void,
    sourceType: SourceType,
    getUserConfirmation?: UserConfirmation,
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
        } else if (sourceType === "browser") {
            trackingCallback(window.confirm(message));
        } else {
            callback(true);
        }
    };

    if (sourceType === "memory") {
        return createMemoryHistory({ getUserConfirmation: getTrackedUserConfirmation });
    } else {
        return createBrowserHistory({ getUserConfirmation: getTrackedUserConfirmation });
    }
}
