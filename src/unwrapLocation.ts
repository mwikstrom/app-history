import { Location } from "history";

import { isWrappedState } from "./isWrappedState";

export function unwrapLocation(source: Location): Location {
    if (isWrappedState(source.state)) {
        return {
            hash: source.hash,
            key: source.key,
            pathname: source.pathname,
            search: source.search,
            state: source.state.inner,
        };
    } else {
        return source;
    }
}
