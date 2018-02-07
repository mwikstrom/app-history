import { createBrowserHistory } from "history";

import { createNotificationManager } from "./createNotificationManager";
import { IHistoryManager } from "./IHistoryManager";
import { IHistoryManagerOptions } from "./IHistoryManagerOptions";

export function createHistoryManager(options: IHistoryManagerOptions = {}): IHistoryManager {
    const {
        history = createBrowserHistory(),
    } = options;

    const {
        listen,
    } = createNotificationManager(history);

    const manager: IHistoryManager = {
        listen,
    };

    Object.freeze(manager);
    return manager;
}
