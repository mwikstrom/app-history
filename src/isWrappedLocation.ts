import { ILocation, IWrappedState } from "./api";
import { isWrappedState } from "./isWrappedState";

export function isWrappedLocation(value: Partial<ILocation>): value is ILocation<IWrappedState> {
    return isWrappedState(value.state);
}
