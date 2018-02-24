import { SourceMode, UserConfirmation } from "./api";

export type WindowConfirm = (message: string) => boolean;

const makeWindowConfirmation = (windowConfirm: WindowConfirm): UserConfirmation => (message, callback) => {
    callback(windowConfirm(message));
};

const noUserConfirmation: UserConfirmation = (_, callback) => {
    callback(true);
};

export const makeUserConfirmation = (
    mode: SourceMode,
    windowConfirm: WindowConfirm = window.confirm,
): UserConfirmation =>
    mode === "browser" ? makeWindowConfirmation(windowConfirm) : noUserConfirmation;
