import type { Asset } from "@/types/trading";

interface WatchlistProps {
  assets: Asset[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export function Watchlist({ assets, selectedSymbol, onSelectSymbol }: WatchlistProps) {
  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span>Watchlist</span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {assets.map((asset) => {
          const isSelected = asset.symbol === selectedSymbol;
          const isPositive = asset.change >= 0;

          return (
            <button
              key={asset.symbol}
              onClick={() => onSelectSymbol(asset.symbol)}
              className={`w-full px-3 py-2.5 text-left border-b border-border/50 transition-colors hover:bg-secondary/50 ${
                isSelected ? "bg-secondary border-l-2 border-l-primary" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-mono text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                  {asset.symbol}
                </span>
                <span className={`font-mono text-xs ${isPositive ? "text-bull" : "text-bear"}`}>
                  {isPositive ? "+" : ""}{asset.change_percent.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">{asset.name}</span>
                <span className="font-mono text-xs text-foreground">
                  {asset.last_price.toLocaleString("pt-BR")}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
