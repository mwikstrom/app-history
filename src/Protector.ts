import { Tracker } from "./Tracker";

export type ProtectionMode = "ready" | "idle";
export type ProtectorStatus = "busy" | ProtectorIdleStatus;
export type ProtectorIdleStatus = "created" | "ready" | "disposed";

type ResolveOnIdle = () => void;

export class Protector {
    private isBusy = 0;
    private idleStatus: ProtectorIdleStatus = "created";
    private resolveOnIdle: ResolveOnIdle[] = [];

    constructor(private tracker: Tracker) {}

    public get status(): ProtectorStatus {
        return this.isBusy === 0 ? this.idleStatus : "busy";
    }

    public sync<T extends (...args: any[]) => any>(
        func: T,
        then?: ProtectorIdleStatus,
    ): T {
        const self = this;
        const wrapped = (...args: any[]) => {
            self.enter();
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
            self.enter();
            try {
                if (mode === "ready" && !self.tracker.ready) {
                    await self.tracker.start();
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
            if (self.isBusy === 0) {
                resolve();
            } else {
                self.resolveOnIdle.push(resolve);
            }
        });
    }

    private enter() {
        this.throwIfLocked();
        this.throwIfDisposed();
        ++this.isBusy;
    }

    private exit(then?: ProtectorIdleStatus) {
        if (--this.isBusy === 0) {
            if (typeof then === "string") {
                this.idleStatus = then;
            }

            this.resolveOnIdle.forEach(callback => callback());
        }
    }

    private throwIfLocked() {
        if (this.isBusy !== 0) {
            throw new Error("app-history: Concurrent operation not allowed");
        }
    }

    private throwIfDisposed() {
        if (this.idleStatus === "disposed") {
            throw new Error("app-history: Operation not allowed after dispose");
        }
    }
}
