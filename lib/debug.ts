export const isDebugLoggingEnabled = process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true';

export function debugLog(...args: unknown[]) {
    if (isDebugLoggingEnabled) {
        console.log(...args);
    }
}
