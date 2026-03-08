import type { Trade } from "@/types/trading";

interface TradeHistoryProps {
  trades: Trade[];
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span>Histórico de Trades</span>
        <span className="font-mono text-xs">{trades.length} trades</span>
      </div>
      <div className="flex-1 overflow-auto scrollbar-thin">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-card">
            <tr className="text-muted-foreground uppercase tracking-wider border-b border-border">
              <th className="text-left py-2 px-3 font-medium">Ativo</th>
              <th className="text-left py-2 px-3 font-medium">Dir</th>
              <th className="text-right py-2 px-3 font-medium">Entrada</th>
              <th className="text-right py-2 px-3 font-medium">Saída</th>
              <th className="text-right py-2 px-3 font-medium">Ctrs</th>
              <th className="text-right py-2 px-3 font-medium">PnL</th>
              <th className="text-left py-2 px-3 font-medium">Modelo</th>
              <th className="text-left py-2 px-3 font-medium">Hora</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr key={trade.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                <td className="py-2 px-3 font-mono font-semibold text-foreground">{trade.symbol}</td>
                <td className={`py-2 px-3 font-mono font-bold ${trade.direction === "LONG" ? "text-bull" : "text-bear"}`}>
                  {trade.direction === "LONG" ? "▲" : "▼"} {trade.direction}
                </td>
                <td className="py-2 px-3 font-mono text-right text-foreground">{trade.entry_price.toLocaleString("pt-BR")}</td>
                <td className="py-2 px-3 font-mono text-right text-foreground">{trade.exit_price.toLocaleString("pt-BR")}</td>
                <td className="py-2 px-3 font-mono text-right text-foreground">{trade.contracts}</td>
                <td className={`py-2 px-3 font-mono text-right font-bold ${trade.pnl >= 0 ? "text-bull" : "text-bear"}`}>
                  {trade.pnl >= 0 ? "+" : ""}R${trade.pnl.toFixed(2)}
                </td>
                <td className="py-2 px-3 uppercase text-muted-foreground">{trade.model_used}</td>
                <td className="py-2 px-3 font-mono text-muted-foreground">
                  {new Date(trade.closed_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
