import { MetricCard } from "@/components/shared/MetricCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  BarChart3, TrendingUp, TrendingDown, Target, DollarSign,
  Percent, Activity, FlaskConical, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Cell
} from "recharts";

// Mock backtest data
const equityData = Array.from({ length: 50 }, (_, i) => ({
  trade: i + 1,
  equity: 10000 + Math.floor(Math.random() * 200 - 50) * (i + 1) / 5 + i * 40,
  drawdown: -(Math.random() * 300 + 50),
}));

const monthlyData = [
  { month: "Jan", pnl: 1200 }, { month: "Fev", pnl: -350 },
  { month: "Mar", pnl: 890 }, { month: "Abr", pnl: 1450 },
  { month: "Mai", pnl: -120 }, { month: "Jun", pnl: 780 },
];

const BacktestPage = () => {
  const metrics = {
    totalTrades: 142,
    winRate: 58.4,
    payoff: 1.85,
    expectancy: 42.5,
    profitFactor: 2.12,
    totalPoints: 4250,
    maxDrawdown: -1850,
    totalReturn: 12450,
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <SectionHeader
        title="Backtest Analytics"
        subtitle="Análise de performance histórica e comparação de modelos"
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <MetricCard label="Total Trades" value={metrics.totalTrades} icon={BarChart3} />
        <MetricCard label="Win Rate" value={`${metrics.winRate}%`} icon={Target} variant={metrics.winRate >= 50 ? "bull" : "bear"} />
        <MetricCard label="Payoff" value={`${metrics.payoff}x`} icon={TrendingUp} variant="primary" />
        <MetricCard label="Expectancy" value={`R$${metrics.expectancy}`} icon={DollarSign} variant="bull" />
        <MetricCard label="Profit Factor" value={metrics.profitFactor.toFixed(2)} icon={Percent} variant="bull" />
        <MetricCard label="Total Points" value={metrics.totalPoints.toLocaleString("pt-BR")} icon={Activity} />
        <MetricCard label="Max Drawdown" value={`R$${metrics.maxDrawdown}`} icon={TrendingDown} variant="bear" />
        <MetricCard label="Retorno" value={`+R$${metrics.totalReturn.toLocaleString("pt-BR")}`} icon={ArrowUpRight} variant="bull" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Equity Curve */}
        <div className="card-premium">
          <div className="panel-header">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Equity Curve
            </span>
          </div>
          <div className="p-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(225, 16%, 15%)" strokeDasharray="3 3" />
                <XAxis dataKey="trade" tick={{ fill: "hsl(220, 15%, 45%)", fontSize: 10 }} axisLine={{ stroke: "hsl(225, 16%, 15%)" }} />
                <YAxis tick={{ fill: "hsl(220, 15%, 45%)", fontSize: 10 }} axisLine={{ stroke: "hsl(225, 16%, 15%)" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(225, 22%, 9%)",
                    border: "1px solid hsl(225, 16%, 15%)",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
                <Area type="monotone" dataKey="equity" stroke="hsl(199, 89%, 48%)" fill="url(#equityGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly PnL */}
        <div className="card-premium">
          <div className="panel-header">
            <span className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              Resultado Mensal
            </span>
          </div>
          <div className="p-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid stroke="hsl(225, 16%, 15%)" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: "hsl(220, 15%, 45%)", fontSize: 10 }} axisLine={{ stroke: "hsl(225, 16%, 15%)" }} />
                <YAxis tick={{ fill: "hsl(220, 15%, 45%)", fontSize: 10 }} axisLine={{ stroke: "hsl(225, 16%, 15%)" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(225, 22%, 9%)",
                    border: "1px solid hsl(225, 16%, 15%)",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? "hsl(142, 71%, 45%)" : "hsl(0, 72%, 51%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Drawdown Curve */}
        <div className="card-premium">
          <div className="panel-header">
            <span className="flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-bear" />
              Drawdown
            </span>
          </div>
          <div className="p-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData}>
                <defs>
                  <linearGradient id="ddGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(225, 16%, 15%)" strokeDasharray="3 3" />
                <XAxis dataKey="trade" tick={{ fill: "hsl(220, 15%, 45%)", fontSize: 10 }} axisLine={{ stroke: "hsl(225, 16%, 15%)" }} />
                <YAxis tick={{ fill: "hsl(220, 15%, 45%)", fontSize: 10 }} axisLine={{ stroke: "hsl(225, 16%, 15%)" }} />
                <Tooltip contentStyle={{ background: "hsl(225, 22%, 9%)", border: "1px solid hsl(225, 16%, 15%)", borderRadius: "8px", fontSize: "11px", fontFamily: "'JetBrains Mono', monospace" }} />
                <Area type="monotone" dataKey="drawdown" stroke="hsl(0, 72%, 51%)" fill="url(#ddGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Comparison placeholder */}
        <div className="card-premium">
          <div className="panel-header">
            <span className="flex items-center gap-1.5">
              <FlaskConical className="h-3.5 w-3.5 text-primary" />
              Comparação de Modelos
            </span>
          </div>
          <div className="p-4">
            <EmptyState
              icon={FlaskConical}
              title="Em desenvolvimento"
              description="Comparação entre modelos estará disponível em breve"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BacktestPage;
