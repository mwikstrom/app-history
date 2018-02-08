import {
    Location,
    LocationDescriptorObject,
    LocationState,
    Path,
} from "history";

import { isWrappedState } from "./isWrappedState";
import { IWrappedState } from "./IWrappedState";
import { BACK, FORWARD, NavigationMode } from "./NavigationMode";

export function createWrappedState(
    sourceLocation: Location,
    mode: NavigationMode,
    pathOrDescriptor: Path | LocationDescriptorObject,
    state?: LocationState,
): IWrappedState {
    let depth = 0;
    let inner = state;

    if (isWrappedState(sourceLocation.state)) {
        depth = sourceLocation.state.depth;

        if (mode === FORWARD) {
            ++depth;
        } else if (mode === BACK && depth > 0) {
            --depth;
        }
    }

    if (typeof pathOrDescriptor === "object") {
        inner = pathOrDescriptor.state;
    }

    return {
        depth,
        inner,
    };
}
