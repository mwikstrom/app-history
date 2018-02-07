import { LocationListener } from "./LocationListener";
import { UnregisterListener } from "./UnregisterListener";

export interface INotificationManager {
    listen(listener: LocationListener): UnregisterListener;
    suppress(state: boolean): void;
}
