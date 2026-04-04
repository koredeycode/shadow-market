
import { createKeystore } from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { fromHex } from '@midnight-ntwrk/midnight-js-utils';
const seed = '0000000000000000000000000000000000000000000000000000000000000001';
const ks = createKeystore(fromHex(seed), 'undeployed');
const addr = ks.getAddress();
console.log('TYPE:', typeof addr);
console.log('KEYS:', Object.keys(addr || {}));
console.log('VALUE:', addr);
if (addr && (addr as any).data) {
    console.log('DATA TYPE:', typeof (addr as any).data);
    console.log('DATA IS BUFFER:', Buffer.isBuffer((addr as any).data));
    console.log('DATA IS UINT8ARRAY:', (addr as any).data instanceof Uint8Array);
}
