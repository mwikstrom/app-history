import { IHistory, ILocation, PUSH, REPLACE } from "./api";
import { isBackOutLocation } from "./Cutter";
import { nextLocation } from "./nextLocation";
import { nextState } from "./nextState";

type RejectFunc = (reason: Error) => void;

export type MutateFunc = () => void;

export class Mutator {
    private rejects: RejectFunc[] = [];

    constructor(
        private source: IHistory,
        private cacheLimit: number,
    ) {}

    public update(action: MutateFunc) {
        return new Promise<void>((resolve, reject) => {
            this.rejects.push(reject);

            const unlisten = this.source.listen(location => {
                if (!isBackOutLocation(location)) {
                    try {
                        unlisten();
                        resolve();
                    } finally {
                        this.rejects.pop();
                    }
                }
            });

            action();
        });
    }

    public push = (
        pathOrDescriptor: string | Partial<ILocation>,
        state?: any,
    ) => this.update(() => {
        if (typeof pathOrDescriptor === "string") {
            this.source.push(pathOrDescriptor, nextState(this.source, PUSH, state, this.cacheLimit));
        } else {
            this.source.push(nextLocation(this.source, PUSH, pathOrDescriptor, this.cacheLimit));
        }
    })

    public replace = (
        pathOrDescriptor: string | Partial<ILocation>,
        state?: any,
    ) => this.update(() => {
        if (typeof pathOrDescriptor === "string") {
            this.source.replace(pathOrDescriptor, nextState(this.source, REPLACE, state, this.cacheLimit));
        } else {
            this.source.replace(nextLocation(this.source, REPLACE, pathOrDescriptor, this.cacheLimit));
        }
    })

    public changeWasBlocked() {
        const next = this.rejects.pop();
        if (next) {
            next(new Error("app-history: navigation was blocked"));
        }
    }
}
