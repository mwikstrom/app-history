import {
    BlockPrompt,
    IHistory,
    ILocation,
    NavigationAction,
} from "./api";

import { Suppressor } from "./Suppressor";

export class Blocker {
    constructor(private source: IHistory, private suppressor: Suppressor, private onBlocked: () => void) { }

    public block = (prompt: boolean | string | BlockPrompt = false) => {
        const wrapper = ((location: ILocation, action: NavigationAction) => {
            let result;

            if (this.suppressor.isActive) {
                result = true;
            } else if (typeof prompt === "function") {
                result = prompt(location, action);
            } else {
                result = prompt;
            }

            if (result === false) {
                this.onBlocked();
            }

            return result;
        }).bind(this);

        return this.source.block(wrapper);
    }
}
