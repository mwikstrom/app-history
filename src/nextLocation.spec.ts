import { createMemoryHistory } from "history";

import { IWrappedState, PUSH } from "./api";
import { nextLocation } from "./nextLocation";

describe("nextLocation", () => {
    it("wraps next meta state ", () => {
        const source = createMemoryHistory();
        source.replace("foo");
        const location = {
            hash: "#bapa",
            key: "key",
            pathname: "bar",
            search: "?apa",
            state: "foo",
        };
        const actual = nextLocation(source, PUSH, location, -1);
        const expected = {
            hash: "#bapa",
            key: "key",
            pathname: "bar",
            search: "?apa",
            state: {
                data: "foo",
                meta: {
                    cache: [ "/foo" ],
                    depth: 1,
                },
            },
        };
        expect(actual).toMatchObject(expected);
    });
});
