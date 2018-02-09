import { IWrappedState } from "./api";
import { isMetaState } from "./isMetaState";

export function isWrappedState(state?: any): state is IWrappedState {
    let ok = false;

    if (typeof state === "object") {
        const { meta } = state;
        ok = isMetaState(meta);
    }

    return ok;
}
