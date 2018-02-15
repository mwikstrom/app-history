import { UnregisterCallback } from "history";
import { PathPredicate } from ".";
import { IHistory } from "./IHistory";
import { ILocation } from "./ILocation";
import { WithSuppressionAction } from "./WithSuppressionAction";

export interface IAppHistory extends IHistory {
    readonly cacheLimit: number;
    readonly depth: number;
    readonly isSuppressed: boolean;

    cut(): IAppHistory;

    findLast(match: string | RegExp | PathPredicate): number;

    go(delta: number): IAppHistory;

    goBack(): IAppHistory;

    goForward(): IAppHistory;

    goHome(to: string, state?: any): IAppHistory;
    goHome(to?: Partial<ILocation>): IAppHistory;

    push(path: string, state?: any): IAppHistory;
    push(location: Partial<ILocation>): IAppHistory;

    replace(path: string, state?: any): IAppHistory;
    replace(location: Partial<ILocation>): IAppHistory;

    suppress(): UnregisterCallback;
    suppress(action: WithSuppressionAction): IAppHistory;
}
