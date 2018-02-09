import { wrapLocation } from "./wrapLocation";
import { initialMetaState } from "./initialMetaState";

describe("wrapLocation", () => {
    it("returns the initial meta state", () => {
        const given = {
            hash: "#hash",
            key: "key",
            pathname: "path",
            search: "?search",
            state: "state",
        };

        const wrapped = wrapLocation(given);

        expect(wrapped.hash).toBe(given.hash);
        expect(wrapped.key).toBe(given.key);
        expect(wrapped.pathname).toBe(given.pathname);
        expect(wrapped.search).toBe(given.search);
        
        const state = wrapped.state;
        expect(state.data).toBe(given.state);
        expect(state.meta).toMatchObject(initialMetaState());
    });
});
