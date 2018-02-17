export type SourceType = "browser" | "memory";

export type UserConfirmationCallback = (result: boolean) => void;
export type UserConfirmation = (message: string, callback: UserConfirmationCallback) => void;

export interface IAppHistoryOptions {
    sourceType?: SourceType;
    getUserConfirmation?: UserConfirmation;
    cacheLimit?: number;
}
