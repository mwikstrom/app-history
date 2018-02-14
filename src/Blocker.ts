import {
    BlockPrompt,
    IHistory,
    ILocation,
    NavigationAction,
} from "./api";

import { Suppressor } from "./Suppressor";

export class Blocker {
    constructor(private source: IHistory, private suppressor: Suppressor) { }

    public block(prompt?: boolean | string | BlockPrompt) {
        const wrapper = ((location: ILocation, action: NavigationAction) => {
            if (this.suppressor.isActive) {
                return true;
            } else if (typeof prompt === "function") {
                return prompt(location, action);
            } else {
                return prompt;
            }
        }).bind(this);

        return this.source.block(wrapper);
    }
}
