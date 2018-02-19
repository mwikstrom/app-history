import { IHistory, ILocation, PathPredicate, UnregisterCallback } from "./api";
import { isWrappedLocation } from "./isWrappedLocation";
import { Mutator } from "./Mutator";
import { Suppressor } from "./Suppressor";

export interface IScanResult {
    delta: number;
    resume: UnregisterCallback | null;
    undo: number;
}

export class Scanner {
    constructor(
        private source: IHistory,
        private suppressor: Suppressor,
        private mutator: Mutator,
    ) {}

    public async scan(
        match?: string | RegExp | PathPredicate | Partial<ILocation>,
    ): Promise<IScanResult> {
        const result: IScanResult = {
            delta: 0,
            resume: null,
            undo: 0,
        };

        if (typeof match === "undefined") {
            result.delta = -1;
            return result;
        }

        if (typeof match === "object" && !(match instanceof RegExp)) {
            match = this.source.createHref(match);
        }

        const predicate: PathPredicate =
            typeof match === "string" ? path => path === match :
            typeof match === "function" ? match :
            match.test.bind(match);

        while (true) {
            if (predicate(this.source.createHref(this.source.location))) {
                return result;
            }

            if (!isWrappedLocation(this.source.location)) {
                break;
            }

            const { cache, depth } = this.source.location.state.meta;

            for (let index = cache.length - 1; index >= 0; --index) {
                --result.delta;

                if (predicate(cache[index])) {
                    return result;
                }
            }

            if (depth <= cache.length) {
                break;
            }

            if (!result.resume) {
                result.resume = this.suppressor.suppress();
            }

            const togo = cache.length + 1;

            result.delta += cache.length;
            result.undo += togo;

            await this.mutator.update(() => this.source.go(-togo));
        }

        result.delta = NaN;
        return result;
    }

    public findLast = async (match: string | RegExp | PathPredicate): Promise<number> => {
        const result = await this.scan(match);

        if (result.undo !== 0) {
            await this.mutator.update(() => this.source.go(result.undo));
            result.delta -= result.undo;
        }

        if (result.resume) {
            result.resume();
        }

        return result.delta;
    }
}
