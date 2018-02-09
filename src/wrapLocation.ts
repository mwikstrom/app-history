import { ILocation, IWrappedState } from "./api";
import { wrapState } from "./wrapState";

export function wrapLocation(source: ILocation): ILocation<IWrappedState> {
    return {
        hash: source.hash,
        key: source.key,
        pathname: source.pathname,
        search: source.search,
        state: wrapState(source.state),
    };
}
