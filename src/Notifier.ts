import {
    Action,
    History,
    Location,
    LocationListener,
    UnregisterCallback,
} from "history";

import { createExposedLocation } from "./createExposedLocation";

export class Notifier {
    private listeners: LocationListener[] = [];
    private registration: UnregisterCallback | null = null;
    private isSuppressing = false;
    private lastSuppressedLocation: Location | null = null;
    private lastSuppressedAction: Action | null = null;

    constructor(private source: History) {
        this.onSourceLocationChanged = this.onSourceLocationChanged.bind(this);
    }

    public listen(listener: LocationListener) {
        let isActive = true;

        const wrapped = (location: Location, action: Action) => {
            if (isActive) {
                listener(location, action);
            }
        };

        this.addListener(wrapped);

        return () => {
            isActive = false;
            this.removeListener(wrapped);
        };
    }

    public suppress(state: boolean) {
        this.isSuppressing = state;

        if (!this.isSuppressing && !!this.lastSuppressedLocation) {
            const notifyLocation = this.lastSuppressedLocation;
            const notifyAction = this.lastSuppressedAction;

            this.lastSuppressedLocation = null;
            this.lastSuppressedAction = null;

            this.notify(notifyLocation, notifyAction!);
        }
    }

    private ensureRegistered() {
        if (!this.registration) {
            this.registration = this.source.listen(this.onSourceLocationChanged);
        }
    }

    private unregisterWhenEmpty() {
        if (this.listeners.length === 0 && !!this.registration) {
            this.registration();
            this.registration = null;
        }
    }

    private addListener(listener: LocationListener) {
        this.listeners.push(listener);
        this.ensureRegistered();
    }

    private removeListener(listener: LocationListener) {
        const index = this.listeners.indexOf(listener);

        if (index >= 0) {
            this.listeners.splice(index, 1);
            this.unregisterWhenEmpty();
        }
    }

    private notify(location: Location, action: Action) {
        this.listeners.forEach(listener => listener(location, action));
    }

    private onSourceLocationChanged(sourceLocation: Location, action: Action) {
        const exposedLocation = createExposedLocation(sourceLocation);

        if (this.isSuppressing) {
            this.lastSuppressedLocation = exposedLocation;
            this.lastSuppressedAction = action;
        } else {
            this.notify(exposedLocation, action);
        }
    }
}
