
export interface ILocation<TState = any> {
    readonly hash: string;
    readonly pathname: string;
    readonly search: string;
    readonly state: TState;
    readonly key?: string;
}
