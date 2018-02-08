import { LocationDescriptorObject } from "history";

import { IWrappedState } from "./IWrappedState";

export function createLocationDescriptor(
    source: LocationDescriptorObject,
    state: IWrappedState,
): LocationDescriptorObject {
    return {
        hash: source.hash,
        key: source.key,
        pathname: source.pathname,
        search: source.search,
        state,
    };
}
