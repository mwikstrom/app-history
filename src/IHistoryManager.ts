import { HistoryManagerListener } from "./HistoryManagerListener";
import { UnregisterHistoryManagerListener } from "./UnregisterHistoryManagerListener";

export interface IHistoryManager {
    listen(listener: HistoryManagerListener): UnregisterHistoryManagerListener;
}
