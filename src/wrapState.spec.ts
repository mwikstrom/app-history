import { wrapState } from "./wrapState";
import { initialMetaState } from "./initialMetaState";

describe("wrapState", () => {
    it("returns the specified meta state", () => {
        const data = "data";
        const meta = {
            cache: ["foo", "bar"],
            depth: 123,
        };
        const wrapped = wrapState(data, meta);

        expect(wrapped.data).toBe(data),
        expect(wrapped.meta).toMatchObject(meta);
    });

    it("returns the initial meta state", () => {
        const data = "data";
        const meta = initialMetaState();
        const wrapped = wrapState(data);

        expect(wrapped.data).toBe(data);
        expect(wrapped.meta).toMatchObject(meta);
    });
});
