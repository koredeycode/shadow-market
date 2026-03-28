/**
 * Utility functions for the API
 */

/**
 * Generate random bytes using Web Crypto API
 *
 * This uses the browser-compatible crypto.getRandomValues()
 * which works in both browser and modern Node environments
 */
export const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);

  // Use Web Crypto API (available in browsers and modern Node)
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    globalThis.crypto.getRandomValues(bytes);
  } else if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(bytes);
  } else {
    throw new Error('Web Crypto API not available');
  }

  return bytes;
};

/**
 * Convert Uint8Array to hex string
 */
export const toHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Convert hex string to Uint8Array
 */
export const fromHex = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
};
