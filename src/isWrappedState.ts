import { LocationState } from "history";

import { IWrappedState } from "./IWrappedState";

export function isWrappedState(state?: LocationState): state is IWrappedState {
    let ok = false;

    if (typeof state === "object") {
        const { depth } = state;
        ok = depth === parseInt(depth, 10) && depth >= 0;
    }

    return ok;
}
