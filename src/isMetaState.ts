import { IMetaState } from "./api";

function isNonNegativeInteger(value: any): value is number {
    return value >= 0 && value === parseInt(value, 10);
}

function isArrayOfStrings(value: any): value is string[] {
    let ok = false;

    if (Array.isArray(value)) {
        ok = true;
        value.forEach(item => ok = ok && typeof item === "string");
    }

    return ok;
}

export function isMetaState(state: any): state is IMetaState {
    let ok = false;

    if (typeof state === "object") {
        const { depth, cache } = state;

        if (isNonNegativeInteger(depth) && isArrayOfStrings(cache)) {
            ok = depth >= cache.length;
        }
    }

    return ok;
}
