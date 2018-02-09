import { IMetaState, IWrappedState } from "./api";
import { initialMetaState } from "./initialMetaState";

export function wrapState(inner?: any, meta: IMetaState = initialMetaState()): IWrappedState {
    return {
        data: inner,
        meta,
    };
}
