import { ILocation, IWrappedState } from "./api";
import { isWrappedState } from "./isWrappedState";

export function isWrappedLocation(value: ILocation): value is ILocation<IWrappedState> {
    return isWrappedState(value.state);
}
