import { HistoryManagerListener } from "./HistoryManagerListener";
import { UnregisterHistoryManagerListener } from "./UnregisterHistoryManagerListener";

export interface NotificationManager {
    listen(listener: HistoryManagerListener): UnregisterHistoryManagerListener;
    suppress(state: boolean): void;
}
