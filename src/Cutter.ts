import { IHistory, ILocation, IWrappedState } from "./api";
import { isWrappedLocation } from "./isWrappedLocation";
import { Mutator } from "./Mutator";
import { Suppressor } from "./Suppressor";
import { wrapLocation } from "./wrapLocation";

export class Cutter {
    private static createDirtyCut = (
        curr: ILocation<IWrappedState>,
        how: "before" | "here",
    ): ILocation<IWrappedState> => ({
        ...curr,
        key: undefined,
        state: {
            ...curr.state,
            meta: {
                ...curr.state.meta,
                cut: how,
            },
        },
    })

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
            ok = meta.depth > 0 || meta.cut === "before";
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
        const curr = isWrappedLocation(this.source.location) ?
            this.source.location : wrapLocation(this.source.location);
        const next = Cutter.createDirtyCut(curr, "before");
        const prev = Cutter.createDirtyCut(curr, "here");
        await this.mutator.update(() => this.source.replace(prev));
        await this.mutator.update(() => this.source.push(next));
    }
}
