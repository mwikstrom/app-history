import { BlockPrompt } from "./BlockPrompt";
import { ILocation } from "./ILocation";
import { NavigationAction } from "./NavigationAction";
import { NavigationListener } from "./NavigationListener";
import { UnregisterCallback } from "./UnregisterCallback";

export interface IHistory {
    length: number;

    action: NavigationAction;

    location: ILocation;

    push(path: string, state?: any): void;
    push(location: ILocation): void;

    replace(path: string, state?: any): void;
    replace(location: ILocation): void;

    go(delta: number): void;

    goBack(): void;

    goForward(): void;

    block(prompt?: boolean | string | BlockPrompt): UnregisterCallback;

    listen(listener: NavigationListener): UnregisterCallback;

    createHref(location: ILocation): string;
}
