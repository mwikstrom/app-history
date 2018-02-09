import { initialMetaState } from "../src/initialMetaState";
import { isMetaState } from "../src/isMetaState";

describe("initialMetaState", () => {
    it("is valid", () => {
        const value = initialMetaState();
        expect(isMetaState(value)).toBe(true);
        expect(value.depth).toBe(0);
        expect(value.cache.length).toBe(0);
    });
});