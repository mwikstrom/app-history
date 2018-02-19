import { WithSuppressionAction } from "./api";

export class Suppressor {
    private count = 0;

    public get isActive() {
        return this.count > 0;
    }

    public suppress = () => {
        let isActive = true;
        ++this.count;

        return () => {
            if (isActive) {
                --this.count;
                isActive = false;
            }
        };
    }

    public suppressWhile = (action: WithSuppressionAction): Promise<void> => {
        const resume = this.suppress();
        let promise: Promise<void> | null = null;

        return new Promise<void>((resolve, reject) => {
            try {
                const result = action();
                if (result instanceof Promise) {
                    promise = result;
                }
            } finally {
                if (promise === null) {
                    resume();
                }
            }

            if (promise === null) {
                resolve();
            } else {
                promise.then(
                    () => {
                        resume();
                        resolve();
                    },
                    () => {
                        resume();
                        reject();
                    },
                );
            }
        });
    }
}
