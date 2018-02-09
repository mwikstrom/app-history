export const PUSH = "PUSH";
export const POP = "POP";
export const REPLACE = "REPLACE";

export type NavigationAction =
    typeof PUSH |
    typeof POP |
    typeof REPLACE;
