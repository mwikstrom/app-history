import {
    IHistory,
    ILocation,
    NavigationAction,
    NavigationListener,
    UnregisterCallback,
} from "./api";

import { unwrapLocation } from "./unwrapLocation";

export class Notifier {
    private listeners: NavigationListener[] = [];
    private registration: UnregisterCallback | null = null;
    private isSuppressing = false;
    private lastSuppressedLocation: ILocation | null = null;
    private lastSuppressedAction: NavigationAction | null = null;

    constructor(private source: IHistory) {
        this.onSourceLocationChanged = this.onSourceLocationChanged.bind(this);
    }

    public listen(listener: NavigationListener) {
        let isActive = true;

        const wrapped = (location: ILocation, action: NavigationAction) => {
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

    private addListener(listener: NavigationListener) {
        this.listeners.push(listener);
        this.ensureRegistered();
    }

    private removeListener(listener: NavigationListener) {
        const index = this.listeners.indexOf(listener);

        if (index >= 0) {
            this.listeners.splice(index, 1);
            this.unregisterWhenEmpty();
        }
    }

    private notify(location: ILocation, action: NavigationAction) {
        this.listeners.forEach(listener => listener(location, action));
    }

    private onSourceLocationChanged(sourceLocation: ILocation, action: NavigationAction) {
        const exposedLocation = unwrapLocation(sourceLocation);

        if (this.isSuppressing) {
            this.lastSuppressedLocation = exposedLocation;
            this.lastSuppressedAction = action;
        } else {
            this.notify(exposedLocation, action);
        }
    }
}
