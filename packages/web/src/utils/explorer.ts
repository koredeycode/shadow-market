import { NETWORK_CONFIG } from '../config/network';

export function getTxExplorerUrl(txHash: string): string {
  if (!NETWORK_CONFIG.explorerBaseUrl.includes('midnight.network')) {
    return '#';
  }
  return `${NETWORK_CONFIG.explorerBaseUrl}/transactions/${txHash}`;
}

export function getContractExplorerUrl(address: string): string {
  if (!NETWORK_CONFIG.explorerBaseUrl.includes('midnight.network')) {
    return '#';
  }
  return `${NETWORK_CONFIG.explorerBaseUrl}/contracts/${address}`;
}

export function isExplorerAvailable(): boolean {
  return NETWORK_CONFIG.explorerBaseUrl.includes('midnight.network');
}
