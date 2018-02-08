import { LocationDescriptorObject } from "history";

import { createLocationDescriptor } from "../src/createLocationDescriptor";
import { IWrappedState } from "../src/IWrappedState";

describe("createLocationDescriptor", () => {
    it("copies fields from source and applies the given wrapped state", () => {
        const expectedState: IWrappedState = {            
        };
        
        const input: LocationDescriptorObject = {
            hash: "#bapa",
            search: "?apa",
            pathname: "olle",
            key: "otto"
        };

        const output = createLocationDescriptor(input, expectedState);
        
        expect(output.hash).toBe(input.hash);
        expect(output.search).toBe(input.search);
        expect(output.pathname).toBe(input.pathname);
        expect(output.key).toBe(input.key);
        expect(output.state).toBe(expectedState);
    });
});