import { ILocation } from "./ILocation";
import { NavigationAction } from "./NavigationAction";

export type BlockPrompt = (
    location: ILocation,
    action: NavigationAction,
) => string;
