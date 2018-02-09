import { unwrapLocation } from "./unwrapLocation";
import { wrapState } from "./wrapState";

describe("unwrapLocation", () => {
    it("returns raw inner state", () => {
        const state = "state";

        const wrapped = {
            hash: "#hash",
            key: "key",
            pathname: "path",
            search: "?search",
            state,
        };

        const unwrapped = unwrapLocation(wrapped);

        expect(unwrapped.hash).toBe(wrapped.hash);
        expect(unwrapped.key).toBe(wrapped.key);
        expect(unwrapped.pathname).toBe(wrapped.pathname);
        expect(unwrapped.search).toBe(wrapped.search);
        expect(unwrapped.state).toBe(state);
    });

    it("returns unwrapped inner state", () => {
        const state = "state";

        const wrapped = {
            hash: "#hash",
            key: "key",
            pathname: "path",
            search: "?search",
            state: wrapState(state),
        };

        const unwrapped = unwrapLocation(wrapped);

        expect(unwrapped.hash).toBe(wrapped.hash);
        expect(unwrapped.key).toBe(wrapped.key);
        expect(unwrapped.pathname).toBe(wrapped.pathname);
        expect(unwrapped.search).toBe(wrapped.search);
        expect(unwrapped.state).toBe(state);
    });
});
