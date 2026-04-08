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
 * Generate a 32-byte nonce that is safe for a Field range
 * (uses 16 bytes of entropy padded with zeros)
 */
export const safeRandomNonce = (): Uint8Array => {
  const nonce = new Uint8Array(32);
  const entropy = randomBytes(16);
  nonce.set(entropy, 0);
  return nonce;
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

/**
 * Convert string to Uint8Array of fixed length (32 bytes)
 * Truncates if too long, pads with 0 if shorter
 */
export const stringToBytes32 = (str: string): Uint8Array => {
  const bytes = new TextEncoder().encode(str);
  const result = new Uint8Array(32);
  result.set(bytes.slice(0, 32));
  return result;
};

/**
 * Converts Bytes<32> (Uint8Array) back to a readable string
 * Trims null characters/padding from the end
 */
export const bytes32ToString = (bytes: Uint8Array): string => {
  const decoder = new TextDecoder();
  const rawString = decoder.decode(bytes);
  // Remove null padding (\0) from the end
  return rawString.replace(/\0+$/, '');
};

/**
 * Get the explorer base URL for a given network
 */
export const getExplorerBaseUrl = (networkId?: string): string | null => {
  const nid = networkId || process.env.MIDNIGHT_NETWORK_ID || 'undeployed';
  if (nid === 'preview') return 'https://explorer.preview.midnight.network';
  if (nid === 'preprod') return 'https://explorer.preprod.midnight.network';
  return null;
};

/**
 * Generate an explorer link for a transaction or contract
 */
export const getExplorerLink = (type: 'transactions' | 'contracts', id: string, networkId?: string): string | null => {
  const base = getExplorerBaseUrl(networkId);
  if (!base) return null;
  return `${base}/${type}/${id}`;
};
