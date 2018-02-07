import { HistoryManagerListener } from "./HistoryManagerListener";
import { UnregisterHistoryManagerListener } from "./UnregisterHistoryManagerListener";

export interface HistoryManager {
    listen(listener: HistoryManagerListener): UnregisterHistoryManagerListener;
}
