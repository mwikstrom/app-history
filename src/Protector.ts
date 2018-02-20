import { Tracker } from "./Tracker";

export type ProtectionMode = "ready" | "idle";

export class Protector {
    private isLocked = 0;

    constructor(private tracker: Tracker) {}

    public sync<T extends (...args: any[]) => any>(func: T): T {
        const self = this;
        const wrapped = (...args: any[]) => {
            self.enter();
            try {
                return func.apply(this, args);
            } finally {
                self.exit();
            }
        };
        return wrapped as T;
    }

    public async<T extends (...args: any[]) => Promise<any>>(func: T, mode: ProtectionMode = "ready"): T {
        const self = this;
        const wrapped = async (...args: any[]) => {
            self.enter();
            try {
                if (mode === "ready" && !self.tracker.ready) {
                    await self.tracker.start();
                }
                return await func.apply(this, args);
            } finally {
                self.exit();
            }
        };
        return wrapped as T;
    }

    private enter() {
        this.throwIfLocked();
        ++this.isLocked;
    }

    private exit() {
        --this.isLocked;
    }

    private throwIfLocked() {
        if (this.isLocked !== 0) {
            throw new Error("app-history: Concurrent operation not allowed");
        }
    }
}
