export const FORWARD = "forward";
export const BACK = "back";
export const REPLACE = "replace";

export type NavigationMode =
    typeof FORWARD |
    typeof BACK |
    typeof REPLACE;
