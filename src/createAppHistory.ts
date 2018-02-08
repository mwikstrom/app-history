import {
    createBrowserHistory,
    Href,
    LocationDescriptorObject,
    LocationListener,
    LocationState,
    Path,
    TransitionPromptHook,
} from "history";

import { createExposedLocation } from "./createExposedLocation";
import { createLocationDescriptor } from "./createLocationDescriptor";
import { createWrappedState } from "./createWrappedState";
import { IAppHistory } from "./IAppHistory";
import { IAppHistoryOptions } from "./IAppHistoryOptions";
import { FORWARD, REPLACE } from "./NavigationMode";
import { Notifier } from "./Notifier";

export function createAppHistory(options: IAppHistoryOptions = {}): IAppHistory {
    const {
        source = createBrowserHistory(),
    } = options;

    const notifier = new Notifier(source);

    const history: IAppHistory = {
        get length() { return source.length; },

        get action() { return source.action; },

        get location() { return createExposedLocation(source.location); },

        push(
            pathOrDescriptor: Path | LocationDescriptorObject,
            state?: LocationState,
        ) {
            const wrappedState = createWrappedState(source.location, FORWARD, pathOrDescriptor, state);

            if (typeof pathOrDescriptor === "string") {
                source.push(pathOrDescriptor, wrappedState);
            } else {
                const descriptor = createLocationDescriptor(pathOrDescriptor, wrappedState);
                source.push(descriptor);
            }
        },

        replace(
            pathOrDescriptor: Path | LocationDescriptorObject,
            state?: LocationState,
        ) {
            const wrappedState = createWrappedState(source.location, REPLACE, pathOrDescriptor, state);

            if (typeof pathOrDescriptor === "string") {
                source.replace(pathOrDescriptor, wrappedState);
            } else {
                const descriptor = createLocationDescriptor(pathOrDescriptor, wrappedState);
                source.replace(descriptor);
            }
        },

        go(delta: number) { source.go(delta); },

        goBack() { source.goBack(); },

        goForward() { source.goForward(); },

        block(prompt?: boolean | string | TransitionPromptHook) {
            return source.block(prompt);
        },

        listen(listener: LocationListener) {
            return notifier.listen(listener);
        },

        createHref(location: LocationDescriptorObject): Href {
            return source.createHref(location);
        },
    };

    Object.freeze(history);
    return history;
}
