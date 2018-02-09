import { IMetaState } from "./api";

export function initialMetaState(): IMetaState {
    return {
        cache: [],
        depth: 0,
    };
}
