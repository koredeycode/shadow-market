export type ViewType = 
  | 'dashboard' 
  | 'markets' 
  | 'market-detail' 
  | 'create' 
  | 'portfolio' 
  | 'wallet' 
  | 'login' 
  | 'link'
  | 'bet-detail';

export interface Market {
  id: string;
  onchainId: string;
  question: string;
  description?: string;
  category: string;
  tags: string[];
  endTime: string;
  yesPrice: string;
  noPrice: string;
  totalVolume: string;
  status: string;
  slug?: string;
}

export interface WalletStatus {
  address: string;
  balance: bigint;
  dust: bigint;
  isSynced: boolean;
  network: string;
  username?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  bets: any[];
  wagers: any[];
}
