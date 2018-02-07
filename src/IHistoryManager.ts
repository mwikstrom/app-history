import { LocationListener } from "./LocationListener";
import { UnregisterListener } from "./UnregisterListener";

export interface IHistoryManager {
    listen(listener: LocationListener): UnregisterListener;
}
