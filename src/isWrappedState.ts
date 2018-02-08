import { LocationState } from "history";

import { IWrappedState } from "./IWrappedState";

export function isWrappedState(state?: LocationState): state is IWrappedState {
    let ok = false;

    if (typeof state === "object") {
        const { depth } = state;
        ok = Number.isInteger(depth) && depth >= 0;
    }

    return ok;
}
