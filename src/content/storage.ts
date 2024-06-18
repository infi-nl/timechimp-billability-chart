export function getTokenFromStorage(): string | null {
    for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (
            key &&
            key.startsWith('CognitoIdentityServiceProvider.') &&
            key.endsWith('.accessToken')
        ) {
            return window.localStorage.getItem(key);
        }
    }
    return null;
}
