import { IHistory } from "./IHistory";

export interface IAppHistory extends IHistory {
    // TODO: Declare extension
    goBack(): void;
}
