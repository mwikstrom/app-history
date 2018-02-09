import { IMetaState, IWrappedState } from "./api";
import { initialMetaState } from "./initialMetaState";

export function wrapState(inner?: any, meta?: IMetaState): IWrappedState {
    return {
        data: inner,
        meta: meta || initialMetaState(),
    };
}
