import { HistoryManagerListener } from "./HistoryManagerListener";
import { UnregisterHistoryManagerListener } from "./UnregisterHistoryManagerListener";

export interface INotificationManager {
    listen(listener: HistoryManagerListener): UnregisterHistoryManagerListener;
    suppress(state: boolean): void;
}
