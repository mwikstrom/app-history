import { UnregisterCallback } from "history";
import { PathPredicate } from ".";
import { IHistory } from "./IHistory";
import { ILocation } from "./ILocation";
import { WithSuppressionAction } from "./WithSuppressionAction";

export interface IAppHistory extends IHistory {
    readonly cacheLimit: number;
    readonly depth: number;
    readonly isSuppressed: boolean;
    readonly source: IHistory;

    cut(): Promise<void>;

    findLast(match: string | RegExp | PathPredicate): Promise<number>;

    go(delta: number): Promise<void>;

    goBack(to: string, state?: any): Promise<boolean>;
    goBack(to?: Partial<ILocation> | RegExp | PathPredicate): Promise<boolean>;

    goForward(): Promise<void>;

    goHome(to: string, state?: any): Promise<void>;
    goHome(to?: Partial<ILocation>): Promise<void>;

    push(path: string, state?: any): Promise<void>;
    push(location: Partial<ILocation>): Promise<void>;

    replace(path: string, state?: any): Promise<void>;
    replace(location: Partial<ILocation>): Promise<void>;

    suppress(): UnregisterCallback;
    suppress(action: WithSuppressionAction): Promise<void>;
}
