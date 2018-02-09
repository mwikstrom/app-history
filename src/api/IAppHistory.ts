import { IHistory } from "./IHistory";

export interface IAppHistory extends IHistory {
    readonly cacheLimit: number;
    readonly depth: number;
    // TODO: Declare goBack() extension
}
