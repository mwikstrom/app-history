import { IHistory, ILocation, NavigationAction, UnregisterCallback } from "./api";

import { isWrappedLocation } from "./isWrappedLocation";
import { Mutator } from "./Mutator";
import { Suppressor } from "./Suppressor";
import { unwrapLocation } from "./unwrapLocation";
import { wrapLocation } from "./wrapLocation";

export class Tracker {
    private trackedLocation: ILocation;
    private trackedAction: NavigationAction;
    private trackedDepth = 0;
    private unlisten: UnregisterCallback | null = null;

    constructor(
        private source: IHistory,
        private suppressor: Suppressor,
        private mutator: Mutator,
    ) {
        this.trackedLocation = source.location;
        this.trackedAction = source.action;
    }

    public get location() { return this.trackedLocation; }
    public get action() { return this.trackedAction; }
    public get depth() { return this.trackedDepth; }
    public get ready() { return !!this.unlisten; }

    public start = async () => {
        await this.setupLocation();

        if (!this.unlisten) {
            this.unlisten = this.source.listen(this.onLocationChanged);
        }
    }

    public stop = () => {
        if (this.unlisten) {
            this.unlisten();
            this.unlisten = null;
        }
    }

    private async setupLocation() {
        if (isWrappedLocation(this.trackedLocation)) {
            const meta = this.trackedLocation.state.meta;
            this.trackedDepth = meta.depth;
            this.trackedLocation = unwrapLocation(this.trackedLocation);
        } else {
            try {
                await this.mutator.update(() => this.source.replace(wrapLocation(this.trackedLocation)));
            } catch (ignored) { /* don't choke on init */ }
        }
    }

    private onLocationChanged = (
        location: ILocation,
        action: NavigationAction,
    ) => {
        if (this.suppressor.isActive) {
            return;
        }

        this.trackedAction = action;

        if (isWrappedLocation(location)) {
            const meta = location.state.meta;
            this.trackedDepth = meta.depth;
            this.trackedLocation = unwrapLocation(location);
        } else {
            this.trackedDepth = 0;
            this.trackedLocation = location;
        }
    }
}
