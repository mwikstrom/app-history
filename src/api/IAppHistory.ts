import { IHistory } from "./IHistory";
import { ILocation } from "./ILocation";

export interface IAppHistory extends IHistory {
    readonly cacheLimit: number;
    readonly depth: number;

    goHome(path: string, state?: any): void;
    goHome(location?: Partial<ILocation>): void;
}
