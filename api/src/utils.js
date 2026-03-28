export const randomBytes = (length) => {
    const bytes = new Uint8Array(length);
    if (typeof globalThis !== 'undefined' && globalThis.crypto) {
        globalThis.crypto.getRandomValues(bytes);
    }
    else if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(bytes);
    }
    else {
        throw new Error('Web Crypto API not available');
    }
    return bytes;
};
//# sourceMappingURL=utils.js.map