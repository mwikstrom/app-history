import { createBrowserHistory } from "history";

import { createNotificationManager } from "./createNotificationManager";
import { HistoryManager } from "./HistoryManager";
import { HistoryManagerOptions } from "./HistoryManagerOptions";

export function createHistoryManager(options: HistoryManagerOptions = {}): HistoryManager {
    const {
        history = createBrowserHistory(),
    } = options;

    const {
        listen,
    } = createNotificationManager(history);

    const manager: HistoryManager = {
        listen,
    };

    Object.freeze(manager);
    return manager;
}
