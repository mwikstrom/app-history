import { initialMetaState } from "./initialMetaState";
import { isWrappedLocation } from "./isWrappedLocation";
import { wrapState } from "./wrapState";

describe("isWrappedLocation", () => {
    it("requires wrapped state", () => {
        expect(isWrappedLocation({})).toBe(false);

        expect(isWrappedLocation({
            state: {},
        })).toBe(false);

        expect(isWrappedLocation({
            state: wrapState(null, initialMetaState()),
        })).toBe(true);
    });
});
