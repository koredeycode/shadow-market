import chalk from 'chalk';

export const getStatusColor = (status: string | undefined): any => {
  if (!status) return chalk.white;
  switch (status.toUpperCase()) {
    case 'OPEN':
    case 'ACTIVE':
    case 'PENDING':
      return chalk.green;
    case 'LOCKED':
    case 'WAITING':
    case 'IN_PROGRESS':
      return chalk.yellow;
    case 'RESOLVED':
    case 'COMPLETED':
    case 'CLAIMED':
      return chalk.blue;
    case 'CANCELLED':
    case 'FAILED':
      return chalk.red;
    default:
      return chalk.white;
  }
};

export const formatCurrency = (amount: bigint | number): string => {
  return amount.toLocaleString();
};

export const formatAddress = (address: string): string => {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

export const formatHash = (hash: string): string => {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
};
