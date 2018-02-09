import { IHistory, IWrappedState, NavigationAction } from "./api";
import { nextMetaState } from "./nextMetaState";
import { wrapState } from "./wrapState";

export function nextState(
    source: IHistory,
    action: NavigationAction,
    state: any,
    cacheLimit: number,
): IWrappedState {
    return wrapState(state, nextMetaState(source, action, cacheLimit));
}
