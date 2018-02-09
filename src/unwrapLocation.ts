import { ILocation } from "./api";
import { isWrappedState } from "./isWrappedState";

export function unwrapLocation(input: ILocation): ILocation {
    if (isWrappedState(input.state)) {
        return {
            hash: input.hash,
            key: input.key,
            pathname: input.pathname,
            search: input.search,
            state: input.state.data,
        };
    } else {
        return input;
    }
}
