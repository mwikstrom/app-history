import { IHistory, ILocation, PathPredicate, UnregisterCallback } from "./api";
import { isWrappedLocation } from "./isWrappedLocation";
import { Mutator } from "./Mutator";
import { Scanner } from "./Scanner";
import { Suppressor } from "./Suppressor";

export class Goer {
    constructor(
        private source: IHistory,
        private suppressor: Suppressor,
        private mutator: Mutator,
        private scanner: Scanner,
    ) {}

    public go = (delta: number) => this.mutator.update(() => this.source.go(delta));

    public goBack = async (
        to?: string | Partial<ILocation> | RegExp | PathPredicate,
        state?: any,
    ): Promise<boolean> => {
        const conditional = to instanceof RegExp || typeof to === "function";

        if (typeof to === "object" && !(to instanceof RegExp)) {
            state = to.state;
        }

        const found = await this.scanner.scan(to);
        let willReplace = typeof state !== "undefined";
        let forcePath: string | null = null;

        if (isNaN(found.delta)) {
            if (conditional) {
                if (found.undo) {
                    await this.go(found.undo);
                }

                if (found.resume) {
                    found.resume();
                }

                return false;
            }

            found.delta = this.distanceToHome();
            willReplace = true;
            forcePath = typeof to === "string" ? to : this.source.createHref(to as Partial<ILocation>);
        }

        if (found.resume && !willReplace) {
            found.resume();
        } else if (!found.resume && willReplace) {
            found.resume = this.suppressor.suppress();
        }

        await this.go(found.delta);

        if (willReplace) {
            found.resume!();

            if (typeof forcePath === "string") {
                await this.mutator.replace(forcePath, state);
            } else {
                await this.mutator.replace({
                    ...this.source.location,
                    state,
                });
            }
        }

        return true;
    }

    public goForward = () => this.mutator.update(() => this.source.goForward());

    public goHome = async (
        to?: string | Partial<ILocation>,
        state?: any,
    ) => {
        const delta = this.distanceToHome();

        if (delta !== 0) {
            let resume: UnregisterCallback | null = null;

            try {
                if (typeof to !== "undefined") {
                    resume = this.suppressor.suppress();
                }

                await this.go(delta);
            } finally {
                if (resume) {
                    resume();
                }
            }
        }

        if (typeof to !== "undefined") {
            await this.mutator.replace(to, state);
        }
    }

    private distanceToHome = () => isWrappedLocation(this.source.location) ? -this.source.location.state.meta.depth : 0;
}
