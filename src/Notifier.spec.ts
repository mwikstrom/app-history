import { createMemoryHistory } from "history";

import { Notifier } from "./Notifier";

describe("Notifier", () => {
    describe("listener", () => {
        it("is invoked when source location changes", () => {
            const source = createMemoryHistory();
            const notifier = new Notifier(source);
            let count = 0;
            const unregister = notifier.listen(() => ++count);
            source.push("apa");
            expect(count).toBe(1);
            unregister();
            source.push("bapa");
            expect(count).toBe(1);
        });

        it("notifications can be suppressed", () => {
            const source = createMemoryHistory();
            const notifier = new Notifier(source);
            let count = 0;
            notifier.listen(() => ++count);
            source.push("apa");
            expect(count).toBe(1);
            const resume1 = notifier.suppress();
            const resume2 = notifier.suppress();
            source.push("bapa");
            expect(count).toBe(1);
            resume1();
            resume1(); // this has no effect
            source.push("olle");
            expect(count).toBe(1);
            resume2();
            source.push("bolle");
            expect(count).toBe(2);
        });

        it("can be registered multiple times", () => {
            const source = createMemoryHistory();
            const notifier = new Notifier(source);
            let count = 0;
            const callback = () => ++count;
            const unregister1 = notifier.listen(callback);
            const unregister2 = notifier.listen(callback);
            source.push("apa");
            expect(count).toBe(2);
            unregister1();
            unregister1(); // this has no effect
            source.push("bapa");
            expect(count).toBe(3);
            unregister2();
            source.push("lapa");
            expect(count).toBe(3);
        });
    });
});
