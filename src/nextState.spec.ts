import { createMemoryHistory } from "history";

import { IWrappedState, PUSH } from "./api";
import { nextState } from "./nextState";

describe("nextState", () => {
    it("wraps next meta state ", () => {
        const source = createMemoryHistory();
        source.replace("foo");
        const actual = nextState(source, PUSH, "bar", -1);
        const expected = {
            data: "bar",
            meta: {
                cache: [ "/foo" ],
                depth: 1,
            },
        };
        expect(actual).toMatchObject(expected);
    });
});
