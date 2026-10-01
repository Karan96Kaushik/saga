export function toErrorMessage(error, fallback) {
    if (error instanceof Error && error.message)
        return error.message;
    if (typeof error === 'object' && error !== null && 'message' in error) {
        const message = error.message;
        if (typeof message === 'string' && message.length > 0)
            return message;
    }
    return fallback;
}
