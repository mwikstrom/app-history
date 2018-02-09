import { ILocation } from "./ILocation";
import { NavigationAction } from "./NavigationAction";

export type NavigationListener = (
    location: ILocation,
    action: NavigationAction,
) => void;
