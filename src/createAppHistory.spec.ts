import { createMemoryHistory } from "history";

import { POP, PUSH, REPLACE } from "./api";
import { createAppHistory } from "./createAppHistory";

describe("createAppHistory", () => {
    it("can be invoked without arguments", () => {
        const history = createAppHistory();
        expect(history.cacheLimit).toBe(20);
    });

    it("can be invoked with cache limit", () => {
        const history = createAppHistory({ cacheLimit: 123 });
        expect(history.cacheLimit).toBe(123);
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

        it("can push using location descriptor", () => {
            const history = createAppHistory({source: createMemoryHistory()});
            history.push({ hash: "#foo" });
            expect(history.location.hash).toBe("#foo");
        });

        it("can replace using location descriptor", () => {
            const history = createAppHistory({source: createMemoryHistory()});
            history.replace({ hash: "#foo" });
            expect(history.location.hash).toBe("#foo");
        });

        it("can go back and forward", () => {
            const history = createAppHistory({source: createMemoryHistory()});
            history.push("foo");
            expect(history.location.pathname).toBe("/foo");
            history.push("bar");
            expect(history.location.pathname).toBe("/bar");
            history.goBack();
            expect(history.location.pathname).toBe("/foo");
            history.goForward();
            expect(history.location.pathname).toBe("/bar");
        });

        it("can go back and forward using delta", () => {
            const history = createAppHistory({source: createMemoryHistory()});
            history.push("foo");
            expect(history.location.pathname).toBe("/foo");
            history.push("bar");
            expect(history.location.pathname).toBe("/bar");
            history.go(0);
            expect(history.location.pathname).toBe("/bar");
            history.go(-1);
            expect(history.location.pathname).toBe("/foo");
            history.go(1);
            expect(history.location.pathname).toBe("/bar");
        });

        it("can block and unblock navigation", () => {
            const history = createAppHistory({
                source: createMemoryHistory({
                    getUserConfirmation() {
                        return false;
                    },
                }),
            });
            history.push("foo");
            expect(history.location.pathname).toBe("/foo");
            const unblock = history.block(() => "blocked");
            history.push("bar");
            expect(history.location.pathname).toBe("/foo");
            unblock();
            history.push("bar");
            expect(history.location.pathname).toBe("/bar");
        });

        it("can listen to location changes", () => {
            const history = createAppHistory({source: createMemoryHistory()});
            let count = 0;
            const stop = history.listen(() => ++count);
            history.push("foo");
            expect(count).toBe(1);
            history.push("bar");
            expect(count).toBe(2);
            stop();
            history.push("baz");
            expect(count).toBe(2);
        });

        it("can create href from descriptor", () => {
            const history = createAppHistory({source: createMemoryHistory()});
            const href = history.createHref({
                hash: "baz",
                pathname: "foo",
                search: "bar",
            });
            expect(href).toBe("foo?bar#baz");
        });

        it("can go home without pushing", () => {
            const history = createAppHistory({source: createMemoryHistory()});
            expect(history.location.pathname).toBe("/");
            expect(history.depth).toBe(0);
            history.goHome();
            expect(history.location.pathname).toBe("/");
            expect(history.depth).toBe(0);
        });

        it("can go home after pushing", () => {
            const history = createAppHistory({source: createMemoryHistory()});
            expect(history.location.pathname).toBe("/");
            history.push("foo");
            history.push("bar");
            expect(history.depth).toBe(2);
            history.goHome();
            expect(history.location.pathname).toBe("/");
            expect(history.depth).toBe(0);
        });

        it("can go home after replacing", () => {
            const history = createAppHistory({source: createMemoryHistory()});
            expect(history.location.pathname).toBe("/");
            history.replace("foo");
            expect(history.depth).toBe(0);
            history.goHome();
            expect(history.location.pathname).toBe("/foo");
            expect(history.depth).toBe(0);
        });

        it("can go home to path", () => {
            const source = createMemoryHistory();
            const history = createAppHistory({source});
            expect(history.location.pathname).toBe("/");
            history.push("foo");
            history.push("bar");
            expect(history.depth).toBe(2);
            let sourceCount = 0;
            let historyCount = 0;
            source.listen(() => ++sourceCount);
            history.listen(() => ++historyCount);
            history.goHome("home");
            expect(history.location.pathname).toBe("/home");
            expect(history.depth).toBe(0);
            expect(sourceCount).toBe(2);
            expect(historyCount).toBe(1);
        });
    });
});
