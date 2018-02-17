import { IAppHistory } from "./IAppHistory";

export type WithSuppressionAction = (history: IAppHistory) => void | Promise<void>;
