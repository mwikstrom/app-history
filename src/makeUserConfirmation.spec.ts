import { makeUserConfirmation } from "./makeUserConfirmation";

describe("makeUserConfirmation", () => {
    describe("for memory", () => {
        it("always confirms true", () => {
            const confirmation = makeUserConfirmation("memory");
            let result: boolean | null = null;
            const callback = value => result = value;
            confirmation("hello world", callback);
            expect(result).toBe(true);
        });
    });

    describe("for browser", () => {
        it("uses the specified window confirm function", () => {
            let invoked = false;
            const windowConfirm = _ => {
                invoked = true;
                return true;
            };
            const confirmation = makeUserConfirmation("browser", windowConfirm);
            let result: boolean | null = null;
            const callback = value => result = value;
            confirmation("hello world", callback);
            expect(result).toBe(true);
            expect(invoked).toBe(true);
        });
    });
});
