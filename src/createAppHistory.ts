import {
    IAppHistory,
    IAppHistoryOptions,
    IHistory,
    ILocation,
    NavigationAction,
} from "./api";

import { Blocker } from "./Blocker";
import { createSource } from "./createSource";
import { Cutter } from "./Cutter";
import { Goer } from "./Goer";
import { Mutator } from "./Mutator";
import { Notifier } from "./Notifier";
import { Protector } from "./Protector";
import { Scanner } from "./Scanner";
import { Suppressor } from "./Suppressor";
import { Tracker } from "./Tracker";

export function createAppHistory(options: IAppHistoryOptions = {}): IAppHistory {
    const {
        sourceType = "browser",
        getUserConfirmation,
        cacheLimit = 20,
    } = options;

    // Navigation block trampoline
    const onChangeWasBlocked = () => mutator.changeWasBlocked();

    // Source history object
    const source = createSource(onChangeWasBlocked, sourceType, getUserConfirmation);

    // Helpers
    const suppressor = new Suppressor();
    const mutator = new Mutator(source, suppressor, cacheLimit);
    const blocker = new Blocker(source, suppressor, onChangeWasBlocked);
    const scanner = new Scanner(source, suppressor, mutator);
    const notifier = new Notifier(source, suppressor);
    const tracker = new Tracker(source, suppressor, mutator);
    const cutter = new Cutter(source, suppressor, mutator);
    const goer = new Goer(source, suppressor, mutator, scanner);
    const protector = new Protector(tracker);

    // Public methods
    const cut = protector.async(cutter.cut);
    const block = blocker.block;
    const createHref = source.createHref.bind(source);
    const dispose = protector.sync(tracker.stop);
    const findLast = protector.async(scanner.findLast);
    const go = protector.async(goer.go);
    const goBack = protector.async(goer.goBack);
    const goForward = protector.async(goer.goForward);
    const goHome = protector.async(goer.goHome);
    const init = protector.async(tracker.start, "idle");
    const listen = notifier.listen;
    const push = protector.async(mutator.push);
    const replace = protector.async(mutator.replace);
    const suppress = protector.sync(suppressor.suppress);
    const suppressWhile = protector.async(suppressor.suppressWhile, "idle");

    // Make the App History object
    const history: IAppHistory = {
        get cacheLimit() { return cacheLimit; },
        get depth(): number { return tracker.depth; },
        get isSuppressed(): boolean { return suppressor.isActive; },
        get length(): number { return source.length; },
        get action(): NavigationAction { return tracker.action; },
        get location(): ILocation { return tracker.location; },
        get source(): IHistory { return source; },

        block,
        createHref,
        cut,
        dispose,
        findLast,
        go,
        goBack,
        goForward,
        goHome,
        init,
        listen,
        push,
        replace,
        suppress,
        suppressWhile,
    };

    Object.freeze(history);
    return history;
}
