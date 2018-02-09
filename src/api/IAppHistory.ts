import { IHistory } from "./IHistory";

export interface IAppHistory extends IHistory {
    readonly depth: number;
    // TODO: Declare goBack() extension
    goBack(): void;
}
