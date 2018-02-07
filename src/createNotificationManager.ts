import { History, UnregisterCallback } from "history";

import { HistoryManagerListener } from "./HistoryManagerListener";
import { HistoryManagerLocation } from "./HistoryManagerLocation";
import { NotificationManager } from "./NotificationManager";

export function createNotificationManager(history: History): NotificationManager {
    const listeners: HistoryManagerListener[] = [];
    let registration: UnregisterCallback | null = null;
    let isSuppressed = false;
    let suppressedLocation: HistoryManagerLocation | null = null;

    const ensureRegistered = () => {
        if (!registration) {
            registration = history.listen(full => {
                const {
                    pathname,
                    search,
                    hash,
                } = full;

                const location: HistoryManagerLocation = {
                    pathname,
                    search,
                    hash,
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

    const addListener = (listener: HistoryManagerListener) => {
        listeners.push(listener);
        ensureRegistered();
    };

    const removeListener = (listener: HistoryManagerListener) => {
        const index = listeners.indexOf(listener);

        if (index >= 0) {
            listeners.splice(index, 1);
            unregisterWhenEmpty();
        }
    };

    const notify = (location: HistoryManagerLocation) => {
        listeners.forEach(listener => listener(location));
    };

    const listen = (listener: HistoryManagerListener) => {
        let isActive = true;

        const wrapped = (location: HistoryManagerLocation) => {
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

    const manager: NotificationManager = {
        listen,
        suppress,
    };

    Object.freeze(manager);
    return manager;
}
