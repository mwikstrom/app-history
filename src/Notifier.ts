import {
    IHistory,
    ILocation,
    NavigationAction,
    NavigationListener,
    UnregisterCallback,
} from "./api";

import { unwrapLocation } from "./unwrapLocation";

export class Notifier {
    private keygen = 0;
    private listeners: { [key: string]: NavigationListener } = {};
    private registration: UnregisterCallback | null = null;
    private isSuppressing = false;
    private lastSuppressedLocation: ILocation | null = null;
    private lastSuppressedAction: NavigationAction | null = null;

    constructor(private source: IHistory) {
        this.onSourceLocationChanged = this.onSourceLocationChanged.bind(this);
    }

    public listen(listener: NavigationListener) {
        const key = this.addListener(listener);
        return this.removeListener.bind(this, key);
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
        if (Object.keys(this.listeners).length === 0 && this.registration) {
            this.registration();
            this.registration = null;
        }
    }

    private addListener(listener: NavigationListener) {
        const key = String(++this.keygen);
        this.listeners[key] = listener;
        this.ensureRegistered();
        return key;
    }

    private removeListener(key: string) {
        delete this.listeners[key];
        this.unregisterWhenEmpty();
    }

    private notify(location: ILocation, action: NavigationAction) {
        Object.keys(this.listeners).forEach(key => {
            this.listeners[key](location, action);
        });
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
