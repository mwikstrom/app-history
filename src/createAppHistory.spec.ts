import { createMemoryHistory } from "history";

import { POP, PUSH, REPLACE } from "./api";
import { createAppHistory } from "./createAppHistory";

describe("createAppHistory", () => {
    it("can be invoked without arguments", () => {
        createAppHistory();
    });

    describe("returns a history extension object that", () => {
        it("keeps track of app history depth", () => {
            const history = createAppHistory({source: createMemoryHistory()});
            expect(history.depth).toBe(0);
            history.push("foo");
            expect(history.depth).toBe(1);
            history.push("bar");
            expect(history.depth).toBe(2);
            history.goBack();
            expect(history.depth).toBe(1);
        });

        it("keeps track of history length", () => {
            const history = createAppHistory({source: createMemoryHistory()});
            expect(history.length).toBe(1);
            history.push("foo");
            expect(history.length).toBe(2);
            history.push("bar");
            expect(history.length).toBe(3);
            history.goBack();
            expect(history.length).toBe(3);
        });

        it("exposes navigation action", () => {
            const history = createAppHistory({source: createMemoryHistory()});
            expect(history.action).toBe(POP);
            history.push("foo");
            expect(history.action).toBe(PUSH);
            history.replace("bar");
            expect(history.action).toBe(REPLACE);
            history.goBack();
            expect(history.action).toBe(POP);
        });
    });
});
