/**
 * Network Configuration
 * Driven exclusively by environment variables (VITE_*)
 */

export const NETWORK_CONFIG = {
  networkId: (import.meta as any).env?.VITE_NETWORK_ID || 'undeployed',
  nodeUrl: (import.meta as any).env?.VITE_MIDNIGHT_NODE_URL || 'ws://localhost:9944',
  indexerUrl: (import.meta as any).env?.VITE_MIDNIGHT_INDEXER_URL || 'http://localhost:8088/api/v4/graphql',
  proofServerUrl: (import.meta as any).env?.VITE_MIDNIGHT_PROOF_SERVER_URL || 'http://localhost:6300',
  explorerBaseUrl: 
    (import.meta as any).env?.VITE_NETWORK_ID === 'preview'
      ? 'https://explorer.preview.midnight.network'
      : (import.meta as any).env?.VITE_NETWORK_ID === 'preprod'
      ? 'https://explorer.preprod.midnight.network'
      : '',
};
