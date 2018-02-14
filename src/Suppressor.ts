export class Suppressor {
    private count = 0;

    public get isActive() {
        return this.count > 0;
    }

    public suppress() {
        let isActive = true;
        ++this.count;

        return () => {
            if (isActive) {
                --this.count;
                isActive = false;
            }
        };
    }
}
