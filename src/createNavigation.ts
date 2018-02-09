import { IHistory, ILocation, PUSH, REPLACE } from "./api";
import { nextLocation } from "./nextLocation";
import { nextState } from "./nextState";

export type CreatableNavigationAction =
    typeof PUSH |
    typeof REPLACE;

export type NavigationFunc = (
    pathOrDescriptor: string | Partial<ILocation>,
    state?: any,
) => void;

export function createNavigation(
    source: IHistory,
    action: CreatableNavigationAction,
    cacheLimit: number,
): NavigationFunc {
    let sourceFunc = action === PUSH ? source.push : source.replace;
    sourceFunc = sourceFunc.bind(source);

    return (pathOrDescriptor: string | ILocation, state?: any) => {
        if (typeof pathOrDescriptor === "string") {
            sourceFunc(pathOrDescriptor, nextState(source, action, state, cacheLimit));
        } else {
            sourceFunc(nextLocation(source, action, pathOrDescriptor, cacheLimit));
        }
    };
}
