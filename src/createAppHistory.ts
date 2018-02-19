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

    // Public methods
    const cut = cutter.cut;
    const block = blocker.block;
    const createHref = source.createHref.bind(source);
    const dispose = tracker.stop;
    const findLast = scanner.findLast;
    const go = goer.go;
    const goBack = goer.goBack;
    const goForward = goer.goForward;
    const goHome = goer.goHome;
    const init = tracker.start;
    const listen = notifier.listen;
    const push = mutator.push;
    const replace = mutator.replace;
    const suppress = suppressor.suppress;
    const suppressWhile = suppressor.suppressWhile;

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
