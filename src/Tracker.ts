import { IHistory, ILocation, NavigationAction, UnregisterCallback } from "./api";

import { initialMetaState } from "./initialMetaState";
import { isWrappedLocation } from "./isWrappedLocation";
import { Mutator } from "./Mutator";
import { Suppressor } from "./Suppressor";
import { unwrapLocation } from "./unwrapLocation";
import { wrapLocation } from "./wrapLocation";

export class Tracker {
    private trackedLocation: ILocation;
    private trackedAction: NavigationAction;
    private trackedDepth = 0;
    private isAfterDirtyCut = false;
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

            if (meta.cut === "here") {
                await this.mutator.update(() => this.source.goForward());
                this.trackedLocation = this.source.location;
                this.isAfterDirtyCut = true;
            } else {
                this.trackedDepth = meta.depth;
                this.isAfterDirtyCut = meta.cut === "before";
            }

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
        this.trackedAction = action;

        if (isWrappedLocation(location)) {
            let meta = location.state.meta;

            if (meta.cut === "here" && !this.suppressor.isActive) {
                this.suppressor.suppressWhile(async () => {
                    if ((this.trackedDepth > meta.depth) ||
                        (this.trackedDepth === meta.depth && this.isAfterDirtyCut)) {
                        await this.source.goBack();
                    } else {
                        await this.source.goForward();
                    }

                    meta = initialMetaState();

                    if (isWrappedLocation(location = this.source.location)) {
                        meta = location.state.meta;
                    }

                    this.trackedDepth = meta.depth;
                    this.isAfterDirtyCut = meta.cut === "before";
                    this.trackedLocation = unwrapLocation(location);
                });
            } else {
                this.trackedDepth = meta.depth;
                this.isAfterDirtyCut = meta.cut === "before";
                this.trackedLocation = unwrapLocation(location);
            }
        } else {
            this.trackedDepth = 0;
            this.isAfterDirtyCut = false;
            this.trackedLocation = unwrapLocation(location);
        }
    }
}
