export function throwInvalidHTMLError(message) {
    throw new InvalidHTMLError(message);
}

export class InvalidHTMLError extends Error {
    /** @param {(string | undefined)} message */
    constructor(message = undefined) {
        super("InvalidHTMLError: " + message);
    }
}