import { isMetaState } from "./isMetaState";

describe("isMetaState", () => {
    it("does not allow negative depth", () => {
        const input = {
            cache: [],
            depth: -1,
        };

        expect(isMetaState(input)).toBe(false);
    });

    it("does not allow infinite depth", () => {
        const input = {
            cache: [],
            depth: Infinity,
        };

        expect(isMetaState(input)).toBe(false);
    });

    it("does not allow non-integer depth", () => {
        const input = {
            cache: [],
            depth: 1.5,
        };

        expect(isMetaState(input)).toBe(false);
    });

    it("does not allow cache to be larger than depth", () => {
        const input = {
            cache: ["foo"],
            depth: 0,
        };

        expect(isMetaState(input)).toBe(false);
    });

    it("does not allow non-string cache entry", () => {
        const input = {
            cache: [123],
            depth: 0,
        };

        expect(isMetaState(input)).toBe(false);
    });

    it("does not allow non-array cache", () => {
        const input = {
            cache: "foo",
            depth: 0,
        };

        expect(isMetaState(input)).toBe(false);
    });

    it("does not allow non-object", () => {
        const input = 0;

        expect(isMetaState(input)).toBe(false);
    });

    it("allows initial", () => {
        const input = {
            cache: [],
            depth: 0,
        };

        expect(isMetaState(input)).toBe(true);
    });

    it("allows typical", () => {
        const input = {
            cache: ["foo", "bar", "baz"],
            depth: 3,
        };

        expect(isMetaState(input)).toBe(true);
    });

    it("allows truncated", () => {
        const input = {
            cache: ["bar", "baz"],
            depth: 3,
        };

        expect(isMetaState(input)).toBe(true);
    });
});
