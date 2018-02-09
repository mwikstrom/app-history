import { BlockPrompt } from "./BlockPrompt";
import { ILocation } from "./ILocation";
import { NavigationAction } from "./NavigationAction";
import { NavigationListener } from "./NavigationListener";
import { UnregisterCallback } from "./UnregisterCallback";

export interface IHistory {
    readonly length: number;

    readonly action: NavigationAction;

    readonly location: ILocation;

    push(path: string, state?: any): void;
    push(location: Partial<ILocation>): void;

    replace(path: string, state?: any): void;
    replace(location: Partial<ILocation>): void;

    go(delta: number): void;

    goBack(): void;

    goForward(): void;

    block(prompt?: boolean | string | BlockPrompt): UnregisterCallback;

    listen(listener: NavigationListener): UnregisterCallback;

    createHref(location: Partial<ILocation>): string;
}
