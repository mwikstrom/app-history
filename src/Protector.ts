import { Tracker } from "./Tracker";

export type ProtectionMode = "ready" | "idle" | "any";
export type ProtectorStatus = "busy" | ProtectorIdleStatus;
export type ProtectorIdleStatus = "created" | "ready" | "disposed";

type ResolveOnIdle = () => void;

export class Protector {
    private isBusy = false;
    private idleStatus: ProtectorIdleStatus = "created";
    private resolveOnIdle: ResolveOnIdle[] = [];

    constructor(private tracker: Tracker) {}

    public get status(): ProtectorStatus {
        return this.isBusy ? "busy" : this.idleStatus;
    }

    public sync<T extends (...args: any[]) => any>(
        func: T,
        mode: ProtectionMode = "idle",
        then?: ProtectorIdleStatus,
    ): T {
        const self = this;
        const wrapped = (...args: any[]) => {
            self.enter(mode === "any");
            try {
                return func.apply(this, args);
            } finally {
                self.exit(then);
            }
        };
        return wrapped as T;
    }

    public async<T extends (...args: any[]) => Promise<any>>(
        func: T,
        mode: ProtectionMode = "ready",
        then?: ProtectorIdleStatus,
    ): T {
        const self = this;
        const wrapped = async (...args: any[]) => {
            self.enter(mode === "any");
            try {
                if (mode === "ready" && !self.tracker.ready) {
                    await self.tracker.start();
                    this.idleStatus = "ready";
                }
                return await func.apply(this, args);
            } finally {
                self.exit(then);
            }
        };
        return wrapped as T;
    }

    public whenIdle = () => {
        const self = this;
        return new Promise<void>(resolve => {
            if (self.isBusy) {
                self.resolveOnIdle.push(resolve);
            } else {
                resolve();
            }
        });
    }

    private enter(ignoreDisposed: boolean) {
        this.throwIfLocked();

        if (!ignoreDisposed) {
            this.throwIfDisposed();
        }

        this.isBusy = true;
    }

    private exit(then?: ProtectorIdleStatus) {
        if (typeof then === "string") {
            this.idleStatus = then;
        }

        this.isBusy = false;

        this.resolveOnIdle.forEach(callback => callback());
    }

    private throwIfLocked() {
        if (this.isBusy) {
            throw new Error("app-history: Concurrent operation not allowed");
        }
    }

    private throwIfDisposed() {
        if (this.idleStatus === "disposed") {
            throw new Error("app-history: Operation not allowed after dispose");
        }
    }
}
