import { IMetaState } from "./IMetaState";

export interface IWrappedState {
    meta: IMetaState;
    data?: any;
}
