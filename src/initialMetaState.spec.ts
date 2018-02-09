import { initialMetaState } from "./initialMetaState";
import { isMetaState } from "./isMetaState";

describe("initialMetaState", () => {
    it("is valid", () => {
        const value = initialMetaState();
        expect(isMetaState(value)).toBe(true);
        expect(value.depth).toBe(0);
        expect(value.cache.length).toBe(0);
    });
});
