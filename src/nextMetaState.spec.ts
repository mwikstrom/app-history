import { createMemoryHistory } from "history";

import { IMetaState, POP, PUSH, REPLACE } from "./api";
import { initialMetaState } from "./initialMetaState";
import { isWrappedLocation } from "./isWrappedLocation";
import { nextMetaState } from "./nextMetaState";
import { wrapState } from "./wrapState";

describe("nextMetaState", () => {
    it("cannot exceed cache limit", () => {
        const source = createMemoryHistory();
        const limit = 2;
        const state0 = initialMetaState();

        source.push("foo", wrapState(null, state0));
        const state1 = nextMetaState(source, PUSH, limit);

        source.push("bar", wrapState(null, state1));
        const state2 = nextMetaState(source, PUSH, limit);

        source.push("baz", wrapState(null, state2));
        const state3 = nextMetaState(source, PUSH, limit);

        expect(state0).toMatchObject({
            cache: [],
            depth: 0,
        });

        expect(state1).toMatchObject({
            cache: ["/foo"],
            depth: 1,
        });

        expect(state2).toMatchObject({
            cache: ["/foo", "/bar"],
            depth: 2,
        });

        expect(state3).toMatchObject({
            cache: ["/bar", "/baz"],
            depth: 3,
        });
    });

    it("can push", () => {
        const source = createMemoryHistory();
        const initialState = {
            cache: ["/foo", "/bar"],
            depth: 123,
        };

        source.replace("baz", wrapState(null, initialState));
        const nextState = nextMetaState(source, PUSH, -1);

        expect(nextState).toMatchObject({
            cache: ["/foo", "/bar", "/baz"],
            depth: 124,
        });
    });

    it("can push with cut", () => {
        const source = createMemoryHistory();
        const initialState: IMetaState = {
            cache: ["/foo", "/bar"],
            cut: "here",
            depth: 123,
        };

        source.replace("baz", wrapState(null, initialState));
        const nextState = nextMetaState(source, PUSH, -1);

        expect(nextState).toMatchObject({
            cache: ["/foo", "/bar", "/baz"],
            cut: "before",
            depth: 124,
        });
    });

    it("can replace", () => {
        const source = createMemoryHistory();
        const initialState = {
            cache: ["/foo", "/bar"],
            depth: 123,
        };

        source.replace("baz", wrapState(null, initialState));
        const nextState = nextMetaState(source, REPLACE, -1);

        expect(nextState).toMatchObject({
            cache: ["/foo", "/bar"],
            depth: 123,
        });
    });

    it("can replace with cut here", () => {
        const source = createMemoryHistory();
        const initialState: IMetaState = {
            cache: ["/foo", "/bar"],
            cut: "here",
            depth: 123,
        };

        source.replace("baz", wrapState(null, initialState));
        const nextState = nextMetaState(source, REPLACE, -1);

        expect(nextState).toMatchObject({
            cache: ["/foo", "/bar"],
            cut: "here",
            depth: 123,
        });
    });

    it("can replace with cut before", () => {
        const source = createMemoryHistory();
        const initialState: IMetaState = {
            cache: ["/foo", "/bar"],
            cut: "before",
            depth: 123,
        };

        source.replace("baz", wrapState(null, initialState));
        const nextState = nextMetaState(source, REPLACE, -1);

        expect(nextState).toMatchObject({
            cache: ["/foo", "/bar"],
            cut: "before",
            depth: 123,
        });
    });

    it("can pop", () => {
        const source = createMemoryHistory();
        const initialState = {
            cache: ["/foo", "/bar"],
            depth: 123,
        };

        source.replace("baz", wrapState(null, initialState));
        const nextState = nextMetaState(source, POP, -1);

        expect(nextState).toMatchObject({
            cache: ["/foo"],
            depth: 122,
        });
    });

    it("can replace initial state", () => {
        const source = createMemoryHistory();

        source.replace("baz");
        const nextState = nextMetaState(source, REPLACE, -1);

        expect(nextState).toMatchObject({
            cache: [],
            depth: 0,
        });
    });
});
