import { IHistory, ILocation, PUSH, REPLACE } from "./api";
import { nextLocation } from "./nextLocation";
import { nextState } from "./nextState";

type RejectFunc = (reason: Error) => void;

export type MutateFunc = () => void;

export class Mutator {
    private currentRejectFunc: RejectFunc | null = null;

    constructor(
        private source: IHistory,
        private cacheLimit: number,
    ) {}

    public update(action: MutateFunc) {
        return new Promise<void>((resolve, reject) => {
            if (this.currentRejectFunc) {
                reject(new Error("app-history: concurrent navigation not supported"));
                return;
            }

            this.currentRejectFunc = () => {
                try {
                    reject();
                } finally {
                    this.currentRejectFunc = null;
                }
            };

            const unlisten = this.source.listen(() => {
                try {
                    unlisten();
                    resolve();
                } finally {
                    this.currentRejectFunc = null;
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
        if (this.currentRejectFunc) {
            this.currentRejectFunc(new Error("app-history: navigation was blocked"));
        }
    }
}
