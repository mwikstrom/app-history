import { LocationState } from "history";

export interface IWrappedState {
    depth: number;
    inner?: LocationState;
}
