import { IHistory, ILocation } from "./api";
import { isWrappedLocation } from "./isWrappedLocation";
import { Mutator } from "./Mutator";
import { Suppressor } from "./Suppressor";

const NOGO_STATE_VALUE = "__NOGO__";

export const isBackOutLocation = (location: ILocation) => location.state === NOGO_STATE_VALUE;

export const makeBackOutLocation = (input: ILocation) => ({
    ...input,
    state: NOGO_STATE_VALUE,
});

export class Cutter {
    constructor(
        private source: IHistory,
        private suppressor: Suppressor,
        private mutator: Mutator,
    ) {}

    public cut = () => this.suppressor.suppressWhile(async () => {
        if (this.canMakeCleanCut()) {
            await this.makeCleanCut();
        } else {
            await this.makeDirtyCut();
        }
    })

    private canMakeCleanCut() {
        let ok = false;

        if (isWrappedLocation(this.source.location)) {
            const meta = this.source.location.state.meta;
            ok = meta.depth > 0;
        }

        return ok;
    }

    private async makeCleanCut() {
        const curr = {
            ...this.source.location,
            key: undefined,
        };
        await this.mutator.update(() => this.source.goBack());
        await this.mutator.update(() => this.source.push(curr));
    }

    private async makeDirtyCut() {
        const nogo = makeBackOutLocation(this.source.location);
        await this.mutator.update(() => this.source.push(nogo));
    }
}
