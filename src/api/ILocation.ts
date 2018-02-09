
export interface ILocation<TState = any> {
    hash: string;
    pathname: string;
    search: string;
    state: TState;
    key?: string;
}
