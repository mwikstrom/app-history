import { createMemoryHistory, MemoryHistory } from "history";

import { IAppHistoryOptions, POP, PUSH, REPLACE } from "./api";
import { createAppHistory } from "./createAppHistory";
import { isBackOutLocation } from "./Cutter";

const createAndInitAppHistory = async (options?: IAppHistoryOptions) => {
    const history = createAppHistory(options);
    await history.init();
    return history;
};

describe("createAppHistory", async () => {
    it("can be invoked without arguments", async () => {
        const history = await createAndInitAppHistory();
        expect(history.cacheLimit).toBe(20);
    });

    it("can be invoked with cache limit", async () => {
        const history = await createAndInitAppHistory({ cacheLimit: 123 });
        expect(history.cacheLimit).toBe(123);
    });

    describe("returns a history extension object that", async () => {
        it("keeps track of app history depth", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            expect(history.depth).toBe(0);
            await history.push("foo");
            expect(history.depth).toBe(1);
            await history.push("bar");
            expect(history.depth).toBe(2);
            await history.goBack();
            expect(history.depth).toBe(1);
        });

        it("keeps track of history length", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            expect(history.length).toBe(1);
            await history.push("foo");
            expect(history.length).toBe(2);
            await history.push("bar");
            expect(history.length).toBe(3);
            await history.goBack();
            expect(history.length).toBe(3);
        });

        it("exposes navigation action", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            expect(history.action).toBe(POP);
            await history.push("foo");
            expect(history.action).toBe(PUSH);
            await history.replace("bar");
            expect(history.action).toBe(REPLACE);
            await history.goBack();
            expect(history.action).toBe(POP);
        });

        it("can push using location descriptor", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            await history.push({ hash: "#foo" });
            expect(history.location.hash).toBe("#foo");
        });

        it("can replace using location descriptor", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            await history.replace({ hash: "#foo" });
            expect(history.location.hash).toBe("#foo");
        });

        it("can go back and forward", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            await history.push("foo");
            expect(history.location.pathname).toBe("/foo");
            await history.push("bar");
            expect(history.location.pathname).toBe("/bar");
            await history.goBack();
            expect(history.location.pathname).toBe("/foo");
            await history.goForward();
            expect(history.location.pathname).toBe("/bar");
        });

        it("can go back and forward using delta", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            await history.push("foo");
            expect(history.location.pathname).toBe("/foo");
            await history.push("bar");
            expect(history.location.pathname).toBe("/bar");
            await history.go(0);
            expect(history.location.pathname).toBe("/bar");
            await history.go(-1);
            expect(history.location.pathname).toBe("/foo");
            await history.go(1);
            expect(history.location.pathname).toBe("/bar");
        });

        it("can block and unblock navigation", async () => {
            const history = await createAndInitAppHistory({
                mode: "memory",
                getUserConfirmation(message, callback) {
                    callback(false);
                },
            });
            await history.push("foo");
            expect(history.location.pathname).toBe("/foo");
            const unblock = history.block("blocked");
            let blocked = false;
            await history.push("bar").catch(() => blocked = true);
            expect(blocked).toBe(true);
            expect(history.location.pathname).toBe("/foo");
            unblock();
            unblock(); // this has no effect
            await history.push("bar");
            expect(history.location.pathname).toBe("/bar");
        });

        it("can listen to location changes", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            let count = 0;
            const stop = history.listen(() => ++count);
            await history.push("foo");
            expect(count).toBe(1);
            await history.push("bar");
            expect(count).toBe(2);
            stop();
            await history.push("baz");
            expect(count).toBe(2);
        });

        it("can create href from descriptor", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            const href = history.createHref({
                hash: "baz",
                pathname: "foo",
                search: "bar",
            });
            expect(href).toBe("foo?bar#baz");
        });

        it("cannot go home after tamper", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            const source = history.source;
            await history.push("a");
            await history.push("b");
            source.push("c");
            await history.goHome();
            expect(history.location.pathname).toBe("/c");
        });

        it("can go home without pushing", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            expect(history.location.pathname).toBe("/");
            expect(history.depth).toBe(0);
            await history.goHome();
            expect(history.location.pathname).toBe("/");
            expect(history.depth).toBe(0);
        });

        it("can go home after pushing", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            expect(history.location.pathname).toBe("/");
            await history.push("foo");
            await history.push("bar");
            expect(history.depth).toBe(2);
            await history.goHome();
            expect(history.location.pathname).toBe("/");
            expect(history.depth).toBe(0);
        });

        it("can go home after replacing", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            expect(history.location.pathname).toBe("/");
            await history.replace("foo");
            expect(history.depth).toBe(0);
            await history.goHome();
            expect(history.location.pathname).toBe("/foo");
            expect(history.depth).toBe(0);
        });

        it("can go home to path", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            const source = history.source;
            expect(history.location.pathname).toBe("/");
            await history.push("foo");
            await history.push("bar");
            expect(history.depth).toBe(2);
            let sourceCount = 0;
            let historyCount = 0;
            source.listen(() => ++sourceCount);
            history.listen(() => ++historyCount);
            await history.goHome("home");
            expect(history.location.pathname).toBe("/home");
            expect(history.depth).toBe(0);
            expect(sourceCount).toBe(2);
            expect(historyCount).toBe(1);
        });

        it("block prompt is only invoked once when going home to path", async () => {
            const history = await createAndInitAppHistory({
                mode: "memory",
                getUserConfirmation(message, callback) {
                    callback(true);
                },
            });
            await history.push("foo");
            await history.push("bar");
            let count = 0;
            history.block(() => {
                ++count;
                return "";
            });
            await history.goHome("home");
            expect(history.location.pathname).toBe("/home");
            expect(history.depth).toBe(0);
            expect(count).toBe(1);
        });

        it("can be suppressed and resumed", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            let count = 0;
            history.listen(() => ++count);
            expect(count).toBe(0);
            await history.push("foo");
            expect(count).toBe(1);
            const resume = history.suppress();
            await history.push("bar");
            expect(count).toBe(1);
            resume();
            await history.push("baz");
            expect(count).toBe(2);
        });

        it("can find delta positions in back stack", async () => {
            const history = await createAndInitAppHistory({mode: "memory", cacheLimit: 3});

            expect(history.location.pathname).toBe("/");
            expect(await history.findLast("/x")).toBe(NaN);
            expect(await history.findLast("/")).toBe(0);
            expect(history.location.pathname).toBe("/");

            await history.push("a");
            await history.push("b");
            await history.push("c");
            await history.push("d");
            await history.push("e");

            expect(history.location.pathname).toBe("/e");

            expect(await history.findLast("/x")).toBe(NaN);
            expect(history.location.pathname).toBe("/e");

            expect(await history.findLast("/e")).toBe(0);
            expect(history.location.pathname).toBe("/e");

            expect(await history.findLast("/d")).toBe(-1);
            expect(history.location.pathname).toBe("/e");

            expect(await history.findLast("/c")).toBe(-2);
            expect(history.location.pathname).toBe("/e");

            expect(await history.findLast("/b")).toBe(-3);
            expect(history.location.pathname).toBe("/e");

            expect(await history.findLast("/a")).toBe(-4);
            expect(history.location.pathname).toBe("/e");

            expect(await history.findLast(path => path === "/b")).toBe(-3);
            expect(history.location.pathname).toBe("/e");

            expect(await history.findLast(/[abc]/)).toBe(-2);
            expect(history.location.pathname).toBe("/e");
        });

        it("cannot find delta when state was tampered", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            const source = history.source;
            await history.push("a");
            await history.push("b");
            source.push("c");
            expect(await history.findLast("/a")).toBe(NaN);
        });

        it("can find delta positions in back stack without any cache", async () => {
            const history = await createAndInitAppHistory({mode: "memory", cacheLimit: 0});

            expect(history.location.pathname).toBe("/");
            expect(await history.findLast("/x")).toBe(NaN);
            expect(await history.findLast("/")).toBe(0);
            expect(history.location.pathname).toBe("/");

            await history.push("a");
            await history.push("b");
            await history.push("c");
            await history.push("d");
            await history.push("e");

            expect(history.location.pathname).toBe("/e");

            expect(await history.findLast("/x")).toBe(NaN);
            expect(history.location.pathname).toBe("/e");

            expect(await history.findLast("/e")).toBe(0);
            expect(history.location.pathname).toBe("/e");

            expect(await history.findLast("/d")).toBe(-1);
            expect(history.location.pathname).toBe("/e");

            expect(await history.findLast("/c")).toBe(-2);
            expect(history.location.pathname).toBe("/e");

            expect(await history.findLast("/b")).toBe(-3);
            expect(history.location.pathname).toBe("/e");

            expect(await history.findLast("/a")).toBe(-4);
            expect(history.location.pathname).toBe("/e");

            expect(await history.findLast(path => path === "/b")).toBe(-3);
            expect(history.location.pathname).toBe("/e");

            expect(await history.findLast(/[abc]/)).toBe(-2);
            expect(history.location.pathname).toBe("/e");
        });

        it("can invoke with suppression", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            expect(history.isSuppressed).toBe(false);
            history.suppressWhile(() => {
                expect(history.isSuppressed).toBe(true);
            });
            expect(history.isSuppressed).toBe(false);
        });

        it("is reset to zero depth when state is tampered", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            const source = history.source;
            await history.push("foo");
            await history.push("bar");
            expect(history.depth).toBe(2);
            source.push("baz");
            expect(history.depth).toBe(0);
        });

        it("can be fooled by fake meta state", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            const source = history.source;
            source.push("fooled", {
                data: "fake",
                meta: { cache: [], depth: 123 },
            });
            expect(history.depth).toBe(123);
            expect(history.location.state).toBe("fake");
        });

        it("can cut history (clean)", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});

            await history.push("a");
            await history.push("b");
            await history.push("c");
            await history.push("d");
            expect(history.location.pathname).toBe("/d");
            expect(history.length).toBe(5);

            await history.go(-2);
            expect(history.location.pathname).toBe("/b");
            expect(history.length).toBe(5);

            await history.goForward();
            expect(history.location.pathname).toBe("/c");
            expect(history.length).toBe(5);

            await history.goBack();
            expect(history.location.pathname).toBe("/b");
            expect(history.length).toBe(5);

            await history.cut();
            expect(history.location.pathname).toBe("/b");
            expect(history.length).toBe(3);

            await history.goForward();
            expect(history.location.pathname).toBe("/b");
        });

        it("can cut history (dirty)", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            const source = history.source as MemoryHistory;
            source.push("a");

            expect(history.location.pathname).toBe("/a");
            expect(history.length).toBe(2);
            expect(source.index).toBe(1);

            await history.push("b");
            expect(history.location.pathname).toBe("/b");
            expect(history.length).toBe(3);
            expect(source.index).toBe(2);

            await history.goBack();
            expect(history.location.pathname).toBe("/a");
            expect(history.length).toBe(3);
            expect(source.index).toBe(1);

            await history.cut();
            expect(history.location.pathname).toBe("/a");
            expect(history.length).toBe(3);
            expect(source.index).toBe(1);

            await history.goForward(); // shall back out again
            expect(history.location.pathname).toBe("/a");
            expect(history.length).toBe(3);
            expect(source.index).toBe(1);

            expect(source.entries[2].state).toBe("__NOGO__");
        });

        it("cannot be initialized on no-go location (will back out)", async () => {
            const history = createAppHistory({mode: "memory"});
            const source = history.source as MemoryHistory;
            source.replace("/a");
            source.push("/b", "__NOGO__");

            expect(source.index).toBe(1);
            expect(isBackOutLocation(source.location)).toBe(true);

            await history.init();

            expect(source.index).toBe(0);
        });

        it("can go back to matched pattern", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            const source = history.source as MemoryHistory;

            await history.push("/a");
            await history.push("/b", "foobar");
            expect(source.index).toBe(2);
            await history.push("/c");
            await history.push("/d");

            let changes = 0;
            history.listen(() => ++changes);
            expect(await history.goBack(/[ab]/)).toBe(true);

            expect(source.index).toBe(2);
            expect(history.location.pathname).toBe("/b");
            expect(history.location.state).toBe("foobar");
            expect(changes).toBe(1);
        });

        it("can go back to matched pattern (no cache)", async () => {
            const history = await createAndInitAppHistory({mode: "memory", cacheLimit: 0});
            const source = history.source as MemoryHistory;

            await history.push("/a");
            await history.push("/b", "foobar");
            expect(source.index).toBe(2);
            await history.push("/c");
            await history.push("/d");

            let changes = 0;
            history.listen(() => ++changes);
            expect(await history.goBack(/[ab]/)).toBe(true);

            expect(source.index).toBe(2);
            expect(history.location.pathname).toBe("/b");
            expect(history.location.state).toBe("foobar");
            expect(changes).toBe(1);
        });

        it("cannot go back to unmatched pattern", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            const source = history.source as MemoryHistory;

            await history.push("/a");
            await history.push("/b", "foobar");
            expect(source.index).toBe(2);
            await history.push("/c");
            await history.push("/d");

            let changes = 0;
            history.listen(() => ++changes);
            expect(await history.goBack(/[x]/)).toBe(false);

            expect(source.index).toBe(4);
            expect(history.location.pathname).toBe("/d");
            expect(changes).toBe(0);
        });

        it("cannot go back to unmatched pattern (nocache)", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            const source = history.source as MemoryHistory;

            await history.push("/a");
            await history.push("/b", "foobar");
            expect(source.index).toBe(2);
            await history.push("/c");
            await history.push("/d");

            let changes = 0;
            history.listen(() => ++changes);
            expect(await history.goBack(/[x]/)).toBe(false);

            expect(source.index).toBe(4);
            expect(history.location.pathname).toBe("/d");
            expect(changes).toBe(0);
        });

        it("can go back to specific path", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            const source = history.source as MemoryHistory;

            await history.push("/a");
            await history.push("/b", "foobar");
            expect(source.index).toBe(2);
            await history.push("/c");
            await history.push("/d");

            let changes = 0;
            history.listen(() => ++changes);
            await history.goBack("/b");

            expect(source.index).toBe(2);
            expect(history.location.pathname).toBe("/b");
            expect(history.location.state).toBe("foobar");
            expect(changes).toBe(1);
        });

        it("can go back to specific path and state", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            const source = history.source as MemoryHistory;

            await history.push("/a");
            await history.push("/b", "foobar");
            expect(source.index).toBe(2);
            await history.push("/c");
            await history.push("/d");

            let changes = 0;
            history.listen(() => ++changes);
            await history.goBack("/b", "fubar");

            expect(source.index).toBe(2);
            expect(history.location.pathname).toBe("/b");
            expect(history.location.state).toBe("fubar");
            expect(changes).toBe(1);
        });

        it("can go back to specific location without state", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            const source = history.source as MemoryHistory;

            await history.push("/a");
            await history.push("/b", "foobar");
            expect(source.index).toBe(2);
            await history.push("/c");
            await history.push("/d");

            let changes = 0;
            history.listen(() => ++changes);
            await history.goBack({ pathname: "/b" });

            expect(source.index).toBe(2);
            expect(history.location.pathname).toBe("/b");
            expect(history.location.state).toBe("foobar");
            expect(changes).toBe(1);
        });

        it("can go back to specific location with state", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            const source = history.source as MemoryHistory;

            await history.push("/a");
            await history.push("/b", "foobar");
            expect(source.index).toBe(2);
            await history.push("/c");
            await history.push("/d");

            let changes = 0;
            history.listen(() => ++changes);
            await history.goBack({ pathname: "/b", state: "fubar" });

            expect(source.index).toBe(2);
            expect(history.location.pathname).toBe("/b");
            expect(history.location.state).toBe("fubar");
            expect(changes).toBe(1);
        });

        it("can go back to unmatched path", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            const source = history.source as MemoryHistory;

            await history.push("/a");
            await history.push("/b", "foobar");
            expect(source.index).toBe(2);
            await history.push("/c");
            await history.push("/d");

            let changes = 0;
            history.listen(() => ++changes);
            await history.goBack("/x");

            expect(source.index).toBe(0);
            expect(history.location.pathname).toBe("/x");
            expect(history.location.state).toBeUndefined();
            expect(changes).toBe(1);
        });

        it("can go back to unmatched path and state", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            const source = history.source as MemoryHistory;

            await history.push("/a");
            await history.push("/b", "foobar");
            expect(source.index).toBe(2);
            await history.push("/c");
            await history.push("/d");

            let changes = 0;
            history.listen(() => ++changes);
            await history.goBack("/x", "fubar");

            expect(source.index).toBe(0);
            expect(history.location.pathname).toBe("/x");
            expect(history.location.state).toBe("fubar");
            expect(changes).toBe(1);
        });

        it("can go back to unmatched location without state", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            const source = history.source as MemoryHistory;

            await history.push("/a");
            await history.push("/b", "foobar");
            expect(source.index).toBe(2);
            await history.push("/c");
            await history.push("/d");

            let changes = 0;
            history.listen(() => ++changes);
            await history.goBack({ pathname: "/x" });

            expect(source.index).toBe(0);
            expect(history.location.pathname).toBe("/x");
            expect(history.location.state).toBeUndefined();
            expect(changes).toBe(1);
        });

        it("can go back to unmatched location with state", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            const source = history.source as MemoryHistory;

            await history.push("/a");
            await history.push("/b", "foobar");
            expect(source.index).toBe(2);
            await history.push("/c");
            await history.push("/d");

            let changes = 0;
            history.listen(() => ++changes);
            await history.goBack({ pathname: "/x", state: "fubar" });

            expect(source.index).toBe(0);
            expect(history.location.pathname).toBe("/x");
            expect(history.location.state).toBe("fubar");
            expect(changes).toBe(1);
        });

        it("cannot be used after dispose", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            history.dispose();
            
            let error: Error | null = null;
            await history.push("bad").catch(reason => error = reason);
            expect(error).not.toBeNull();
            expect(error.message).toBe("app-history: Operation not allowed after dispose")
        });

        it("does not allow concurrent operations", async () => {
            let error: Error | null = null;

            const history = await createAndInitAppHistory({
                mode: "memory",
                getUserConfirmation(message, callback) {
                    history.push("bad").catch(reason => error = reason).then(() => callback(true));
                }
            });

            history.block("blocked");
            await history.push("test");

            expect(error).not.toBeNull();
            expect(error.message).toBe("app-history: Concurrent operation not allowed")
        });

        it("allows waiting for idle when not busy", async () => {
            const history = await createAndInitAppHistory({mode: "memory"});
            expect(history.isBusy).toBe(false);
            await history.whenIdle();
        });

        it("allows waiting for idle when busy", async () => {
            let waitDone = false;

            const history = await createAndInitAppHistory({
                mode: "memory",
                getUserConfirmation(message, callback) {
                    expect(history.isBusy).toBe(true);
                    history.whenIdle().then(() => waitDone = true);
                    callback(true);
                }
            });

            history.block("blocked");
            await history.push("test");

            expect(waitDone).toBe(true);
        });

        it("can be used without explicit init", async () => {
            const history = await createAppHistory({mode:"memory"});
            expect(history.status).toBe("created");
            await history.push("test");
            expect(history.status).toBe("ready");
        });
    });
});
