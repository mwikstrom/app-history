import {
    Location,
    LocationDescriptorObject,
    LocationState,
    Path,
} from "history";

import { IWrappedState } from "./IWrappedState";
import { NavigationMode } from "./NavigationMode";

export function createWrappedState(
    sourceLocation: Location,
    mode: NavigationMode,
    pathOrDescriptor: Path | LocationDescriptorObject,
    state?: LocationState,
): IWrappedState {
    // TODO: Implement createWrappedState
    // This is a dummy to avoid TS6133
    if (!state) {
        state = !!sourceLocation && !!mode && !!pathOrDescriptor;
    }

    return {
        inner: state,
    };
}
