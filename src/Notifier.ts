import {
    IHistory,
    ILocation,
    NavigationAction,
    NavigationListener,
    UnregisterCallback,
} from "./api";

import { Suppressor } from "./Suppressor";
import { unwrapLocation } from "./unwrapLocation";

export class Notifier {
    private listeners: NavigationListener[] = [];
    private unregister: UnregisterCallback | null = null;

    constructor(private source: IHistory, private suppressor: Suppressor) {
        this.onSourceLocationChanged = this.onSourceLocationChanged.bind(this);
    }

    public listen(listener: NavigationListener) {
        let isActive = true;

        this.listeners.push(listener);
        this.ensureRegistered();

        return () => {
            const index = this.listeners.indexOf(listener);
            if (index >= 0 && isActive) {
                this.listeners.splice(index, 1);
                isActive = false;
                this.unregisterWhenEmpty();
            }
        };
    }

    private ensureRegistered() {
        if (!this.unregister) {
            this.unregister = this.source.listen(this.onSourceLocationChanged);
        }
    }

    private unregisterWhenEmpty() {
        if (this.listeners.length === 0 && this.unregister) {
            this.unregister();
            this.unregister = null;
        }
    }

    private notify(location: ILocation, action: NavigationAction) {
        this.listeners.forEach(listener => {
            listener(location, action);
        });
    }

    private onSourceLocationChanged(sourceLocation: ILocation, action: NavigationAction) {
        if (!this.suppressor.isActive) {
            const exposedLocation = unwrapLocation(sourceLocation);
            this.notify(exposedLocation, action);
        }
    }
}
