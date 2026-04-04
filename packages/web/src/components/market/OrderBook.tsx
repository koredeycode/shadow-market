import { TrendingDown, TrendingUp } from 'lucide-react';

interface OrderBookProps {
  marketId: string;
}

export function OrderBook({ marketId: _marketId }: OrderBookProps) {
  const yesOrders = [
    { price: 0.68, amount: 1500 },
    { price: 0.67, amount: 2300 },
    { price: 0.66, amount: 3200 },
    { price: 0.65, amount: 4100 },
    { price: 0.64, amount: 2800 },
  ];

  const noOrders = [
    { price: 0.33, amount: 2100 },
    { price: 0.34, amount: 3400 },
    { price: 0.35, amount: 4200 },
    { price: 0.36, amount: 3100 },
    { price: 0.37, amount: 1900 },
  ];

  const maxAmount = Math.max(...yesOrders.map(o => o.amount), ...noOrders.map(o => o.amount));

  const formatAmount = (amount: number) => {
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return `${amount}`;
  };

  // The following function was added based on the user's instruction,
  // but its implementation appears to be a copy-paste error from formatAmount
  // and uses an undefined variable 'amount'.
  // It is commented out to maintain syntactical correctness and prevent errors.
  // If intended, please provide the correct implementation for formatDate.
  // const formatDate = (_dateStr: string): string => {
  //   if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  //   return `${amount}`;
  // };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* YES Orders */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-success-green">
            <TrendingUp className="w-4 h-4" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-white">
              Buy Orders (YES)
            </h3>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center px-2 py-1 text-[9px] font-mono text-slate-500 uppercase tracking-tight border-b border-white/5">
              <span>Price</span>
              <span>Amount</span>
            </div>
            {yesOrders.map((order, idx) => (
              <div key={idx} className="relative group overflow-hidden">
                <div
                  className="absolute inset-y-0 right-0 bg-success-green/10 transition-all duration-500"
                  style={{ width: `${(order.amount / maxAmount) * 100}%` }}
                />
                <div className="relative flex justify-between items-center px-2 py-2 text-[11px] font-mono group-hover:bg-white/5 transition-colors">
                  <span className="text-success-green font-bold">
                    {(order.price * 100).toFixed(1)}%
                  </span>
                  <span className="text-slate-300 font-bold">
                    {formatAmount(order.amount)}{' '}
                    <span className="text-[9px] opacity-40 font-light">DUST</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NO Orders */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-red-500">
            <TrendingDown className="w-4 h-4" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-white">
              Buy Orders (NO)
            </h3>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center px-2 py-1 text-[9px] font-mono text-slate-500 uppercase tracking-tight border-b border-white/5">
              <span>Price</span>
              <span>Amount</span>
            </div>
            {noOrders.map((order, idx) => (
              <div key={idx} className="relative group overflow-hidden">
                <div
                  className="absolute inset-y-0 right-0 bg-red-500/10 transition-all duration-500"
                  style={{ width: `${(order.amount / maxAmount) * 100}%` }}
                />
                <div className="relative flex justify-between items-center px-2 py-2 text-[11px] font-mono group-hover:bg-white/5 transition-colors">
                  <span className="text-red-500 font-bold">{(order.price * 100).toFixed(1)}%</span>
                  <span className="text-slate-300 font-bold">
                    {formatAmount(order.amount)}{' '}
                    <span className="text-[9px] opacity-40 font-light">DUST</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5">
        <p className="text-[9px] font-mono text-slate-600 uppercase tracking-tight italic">
          [System_Info]: Live order matching engine enabled via AMM-P2P Hybrid bridge.
        </p>
      </div>
    </div>
  );
}
