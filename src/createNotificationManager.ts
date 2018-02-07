import { History, UnregisterCallback } from "history";

import { ILocation } from "./ILocation";
import { INotificationManager } from "./INotificationManager";
import { LocationListener } from "./LocationListener";

export function createNotificationManager(history: History): INotificationManager {
    const listeners: LocationListener[] = [];
    let registration: UnregisterCallback | null = null;
    let isSuppressed = false;
    let suppressedLocation: ILocation | null = null;

    const ensureRegistered = () => {
        if (!registration) {
            registration = history.listen(full => {
                const {
                    hash,
                    pathname,
                    search,
                } = full;

                const location: ILocation = {
                    hash,
                    pathname,
                    search,
                };

                Object.freeze(location);

                if (isSuppressed) {
                    suppressedLocation = location;
                } else {
                    notify(location);
                }
            });
        }
    };

    const unregisterWhenEmpty = () => {
        if (listeners.length === 0 && !!registration) {
            registration();
            registration = null;
        }
    };

    const addListener = (listener: LocationListener) => {
        listeners.push(listener);
        ensureRegistered();
    };

    const removeListener = (listener: LocationListener) => {
        const index = listeners.indexOf(listener);

        if (index >= 0) {
            listeners.splice(index, 1);
            unregisterWhenEmpty();
        }
    };

    const notify = (location: ILocation) => {
        listeners.forEach(listener => listener(location));
    };

    const listen = (listener: LocationListener) => {
        let isActive = true;

        const wrapped = (location: ILocation) => {
            if (isActive) {
                listener(location);
            }
        };

        addListener(wrapped);

        return () => {
            isActive = false;
            removeListener(wrapped);
        };
    };

    const suppress = (state: boolean) => {
        isSuppressed = state;

        if (!isSuppressed && !!suppressedLocation) {
            const recovered = suppressedLocation;
            suppressedLocation = null;
            notify(recovered);
        }
    };

    const manager: INotificationManager = {
        listen,
        suppress,
    };

    Object.freeze(manager);
    return manager;
}
