import { mockData } from "@/services/api";
import { MetricCard } from "@/components/shared/MetricCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  DollarSign, Target, BarChart3, Shield, Clock, AlertTriangle,
  CheckCircle, XCircle, Ban
} from "lucide-react";

const ExecucaoPage = () => {
  const position = mockData.position;
  const trades = mockData.trades;
  const sessionPnl = 770;
  const winCount = trades.filter(t => t.pnl >= 0).length;
  const lossCount = trades.filter(t => t.pnl < 0).length;
  const winrate = trades.length > 0 ? (winCount / trades.length * 100) : 0;
  const maxDrawdown = Math.min(...trades.map(t => t.pnl));

  // Risk manager rules
  const riskRules = [
    { rule: "Max trades/dia", value: "6", current: `${trades.length}`, active: true, ok: trades.length < 6 },
    { rule: "Stop diário", value: "R$ -500", current: sessionPnl >= -500 ? "OK" : "ATINGIDO", active: true, ok: sessionPnl >= -500 },
    { rule: "Take diário", value: "R$ 1.500", current: sessionPnl < 1500 ? "OK" : "ATINGIDO", active: true, ok: sessionPnl < 1500 },
    { rule: "Bloqueio horário", value: "18:00", current: "Livre", active: true, ok: true },
    { rule: "Bloqueio regime", value: "VOLATILE", current: "OK", active: true, ok: true },
    { rule: "Confiança mínima", value: "55%", current: "73%", active: true, ok: true },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Execução"
          subtitle="Paper trading, posições, ordens e gestão de risco"
        />
        <StatusBadge status="paper" label="Paper Trading" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <MetricCard
          label="PnL do Dia"
          value={`${sessionPnl >= 0 ? "+" : ""}R$${sessionPnl}`}
          icon={DollarSign}
          variant={sessionPnl >= 0 ? "bull" : "bear"}
        />
        <MetricCard label="Trades" value={trades.length} icon={BarChart3} />
        <MetricCard label="Wins" value={winCount} icon={CheckCircle} variant="bull" />
        <MetricCard label="Losses" value={lossCount} icon={XCircle} variant="bear" />
        <MetricCard
          label="Win Rate"
          value={`${winrate.toFixed(0)}%`}
          icon={Target}
          variant={winrate >= 50 ? "bull" : "bear"}
        />
        <MetricCard
          label="Max DD"
          value={`R$${maxDrawdown}`}
          icon={TrendingDown}
          variant="bear"
        />
        <MetricCard label="Risk Mgr" value="OK" icon={Shield} variant="bull" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Position Panel */}
        <div className="card-premium">
          <div className="panel-header">
            <span className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-primary" />
              Posição Atual
            </span>
            {position && (
              <span className={`font-mono text-xs font-bold ${position.pnl >= 0 ? "text-bull" : "text-bear"}`}>
                {position.pnl >= 0 ? "+" : ""}R${position.pnl.toFixed(2)}
              </span>
            )}
          </div>
          <div className="p-4">
            {position ? (
              <div className="space-y-0">
                {[
                  { label: "Ativo", value: position.symbol },
                  { label: "Lado", value: position.direction, color: position.direction === "LONG" ? "text-bull" : "text-bear" },
                  { label: "Entrada", value: position.entry_price.toLocaleString("pt-BR") },
                  { label: "Atual", value: position.current_price.toLocaleString("pt-BR") },
                  { label: "Contratos", value: position.contracts.toString() },
                  { label: "Tempo", value: `${Math.floor((Date.now() - new Date(position.opened_at).getTime()) / 60000)} min` },
                ].map((item, i) => (
                  <div key={i} className="data-row">
                    <span className="data-label">{item.label}</span>
                    <span className={`data-value ${item.color ?? ""}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Target} title="Sem posição aberta" description="Aguardando próximo sinal" />
            )}
          </div>
        </div>

        {/* Risk Manager */}
        <div className="card-premium">
          <div className="panel-header">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Risk Manager
            </span>
            <StatusBadge status="online" label="Ativo" />
          </div>
          <div className="p-4 space-y-1">
            {riskRules.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-2">
                  {r.ok ? (
                    <CheckCircle className="h-3.5 w-3.5 text-bull" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-bear" />
                  )}
                  <span className="text-xs text-muted-foreground">{r.rule}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground">{r.value}</span>
                  <span className={`font-mono text-xs font-semibold ${r.ok ? "text-bull" : "text-bear"}`}>
                    {r.current}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Session Info */}
        <div className="card-premium">
          <div className="panel-header">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Sessão
            </span>
          </div>
          <div className="p-4 space-y-0">
            {[
              { label: "Modo", value: "Paper Trading" },
              { label: "Símbolo", value: "WINJ26" },
              { label: "Início", value: "09:00" },
              { label: "Duração", value: "4h 30min" },
              { label: "Trades Abertos", value: position ? "1" : "0" },
              { label: "Trades Fechados", value: trades.length.toString() },
            ].map((item, i) => (
              <div key={i} className="data-row">
                <span className="data-label">{item.label}</span>
                <span className="data-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trade History */}
      <div className="card-premium">
        <div className="panel-header">
          <span className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            Histórico Operacional
          </span>
          <span className="font-mono text-[10px]">{trades.length} trades</span>
        </div>
        <div className="overflow-auto max-h-[400px] scrollbar-thin">
          <table className="table-premium">
            <thead>
              <tr>
                <th>Ativo</th>
                <th>Lado</th>
                <th className="text-right">Entrada</th>
                <th className="text-right">Saída</th>
                <th className="text-right">Ctrs</th>
                <th className="text-right">PnL</th>
                <th>Modelo</th>
                <th>Hora</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.id}>
                  <td className="font-semibold text-foreground">{trade.symbol}</td>
                  <td>
                    <span className={`flex items-center gap-1 font-bold ${trade.direction === "LONG" ? "text-bull" : "text-bear"}`}>
                      {trade.direction === "LONG" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {trade.direction}
                    </span>
                  </td>
                  <td className="text-right text-foreground">{trade.entry_price.toLocaleString("pt-BR")}</td>
                  <td className="text-right text-foreground">{trade.exit_price.toLocaleString("pt-BR")}</td>
                  <td className="text-right">{trade.contracts}</td>
                  <td className={`text-right font-bold ${trade.pnl >= 0 ? "text-bull" : "text-bear"}`}>
                    {trade.pnl >= 0 ? "+" : ""}R${trade.pnl.toFixed(2)}
                  </td>
                  <td className="text-muted-foreground uppercase text-[10px]">{trade.model_used}</td>
                  <td className="text-muted-foreground">
                    {new Date(trade.closed_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExecucaoPage;
