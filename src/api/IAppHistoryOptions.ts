import { IHistory } from ".";

export type SourceMode = "browser" | "memory";

export type UserConfirmationCallback = (result: boolean) => void;
export type UserConfirmation = (message: string, callback: UserConfirmationCallback) => void;

export interface ISourceHistoryOptions {
    getUserConfirmation: UserConfirmation;
}

export interface IHistoryProvider {
    createMemoryHistory?(options: ISourceHistoryOptions): IHistory;
    createBrowserHistory?(options: ISourceHistoryOptions): IHistory;
}

export interface IAppHistoryOptions {
    mode?: SourceMode;
    provider?: IHistoryProvider;
    getUserConfirmation?: UserConfirmation;
    cacheLimit?: number;
}
