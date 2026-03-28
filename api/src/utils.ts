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
