import { UnregisterCallback } from "history";
import { PathPredicate } from ".";
import { IHistory } from "./IHistory";
import { ILocation } from "./ILocation";
import { WithSuppressionAction } from "./WithSuppressionAction";

export interface IAppHistory extends IHistory {
    readonly cacheLimit: number;
    readonly depth: number;
    readonly isSuppressed: boolean;

    cut(): void;

    findLast(match: string | RegExp | PathPredicate): number;

    goHome(to: string, state?: any): void;
    goHome(to?: Partial<ILocation>): void;

    suppress(): UnregisterCallback;
    suppress(action: WithSuppressionAction): void;
}
