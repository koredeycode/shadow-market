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
export const safeRandomNonce = () => {
    const nonce = new Uint8Array(32);
    const entropy = randomBytes(16);
    nonce.set(entropy, 0);
    return nonce;
};
export const toHex = (bytes) => {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
};
export const fromHex = (hex) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
};
export const stringToBytes32 = (str) => {
    const bytes = new TextEncoder().encode(str);
    const result = new Uint8Array(32);
    result.set(bytes.slice(0, 32));
    return result;
};
export const bytes32ToString = (bytes) => {
    const decoder = new TextDecoder();
    const rawString = decoder.decode(bytes);
    return rawString.replace(/\0+$/, '');
};
//# sourceMappingURL=utils.js.map