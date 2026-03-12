import { useState } from "react";
import { mockData } from "@/services/api";
import { MetricCard } from "@/components/shared/MetricCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SectionHeader } from "@/components/shared/SectionHeader";
import {
  Brain, TrendingUp, TrendingDown, Minus, Target, Shield,
  Zap, BarChart3, Clock, AlertTriangle, Activity, Eye
} from "lucide-react";

const IAPage = () => {
  const signal = mockData.signal;
  const isLong = signal.direction === "LONG";
  const isShort = signal.direction === "SHORT";

  // Mock data for features
  const topFeatures = [
    { name: "RSI(14)", value: "62.3", impact: "high" as const },
    { name: "MACD Hist", value: "+15.2", impact: "high" as const },
    { name: "EMA9 vs EMA21", value: "Acima", impact: "medium" as const },
    { name: "Volume ZScore", value: "1.8", impact: "medium" as const },
    { name: "ATR(14)", value: "245", impact: "low" as const },
    { name: "VWAP Distance", value: "+32pts", impact: "low" as const },
  ];

  const signalHistory = [
    { ts: "13:30", price: 130250, signal: "LONG", confidence: 0.73, regime: "TRENDING", action: "Executado" },
    { ts: "13:15", price: 130180, signal: "WAIT", confidence: 0.45, regime: "TRENDING", action: "Bloqueado" },
    { ts: "13:00", price: 130100, signal: "LONG", confidence: 0.68, regime: "MEAN_REV", action: "Bloqueado" },
    { ts: "12:45", price: 130050, signal: "SHORT", confidence: 0.71, regime: "VOLATILE", action: "Executado" },
    { ts: "12:30", price: 129980, signal: "WAIT", confidence: 0.35, regime: "CALM", action: "Ignorado" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Inteligência Artificial"
          subtitle="Monitoramento de sinais, regime e decisões do modelo"
        />
        <StatusBadge status="paper" label="Paper Trading" />
      </div>

      {/* Signal Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className={`metric-card ${isLong ? "glow-bull" : isShort ? "glow-bear" : ""}`}>
          <div className="flex items-center gap-2 mb-2">
            {isLong ? <TrendingUp className="h-5 w-5 text-bull" /> : isShort ? <TrendingDown className="h-5 w-5 text-bear" /> : <Minus className="h-5 w-5 text-muted-foreground" />}
            <span className="text-xs font-medium text-muted-foreground uppercase">Sinal</span>
          </div>
          <p className={`font-mono text-2xl font-bold ${isLong ? "text-bull" : isShort ? "text-bear" : "text-muted-foreground"}`}>
            {signal.direction}
          </p>
        </div>

        <MetricCard
          label="Confiança"
          value={`${(signal.probability * 100).toFixed(0)}%`}
          icon={Target}
          variant={signal.probability > 0.65 ? "bull" : signal.probability > 0.5 ? "warning" : "bear"}
        />

        <MetricCard
          label="Regime"
          value={signal.regime}
          icon={Activity}
        />

        <MetricCard
          label="Modelo"
          value={signal.model_used.toUpperCase()}
          icon={Brain}
          variant="primary"
        />

        <MetricCard
          label="Vol Regime"
          value={signal.vol_regime}
          icon={BarChart3}
          variant={signal.vol_regime === "HIGH" || signal.vol_regime === "EXTREME" ? "warning" : "default"}
        />

        <MetricCard
          label="Meta State"
          value={signal.meta_state}
          icon={Shield}
          variant={signal.meta_state === "DEFENSIVE" ? "warning" : signal.meta_state === "OFF" ? "bear" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Explainability */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card-premium">
            <div className="panel-header">
              <span className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-primary" />
                Top Features
              </span>
            </div>
            <div className="p-4 space-y-2">
              {topFeatures.map((f, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${f.impact === "high" ? "bg-primary" : f.impact === "medium" ? "bg-warning" : "bg-muted-foreground"}`} />
                    <span className="text-xs text-muted-foreground">{f.name}</span>
                  </div>
                  <span className="font-mono text-xs text-foreground">{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reasoning */}
          <div className="card-premium">
            <div className="panel-header">
              <span className="flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-primary" />
                Raciocínio
              </span>
            </div>
            <div className="p-4">
              <p className="text-xs text-secondary-foreground leading-relaxed">{signal.reason}</p>
              <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(signal.timestamp).toLocaleTimeString("pt-BR")}
              </div>
            </div>
          </div>

          {/* Operational State */}
          <div className="card-premium">
            <div className="panel-header">
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-primary" />
                Estado Operacional
              </span>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: "Modo", value: "Paper Trading", status: "paper" as const },
                { label: "Observando", value: "Sim", status: "online" as const },
                { label: "Emitindo Sinais", value: "Sim", status: "online" as const },
                { label: "Execução", value: "Simulada", status: "paper" as const },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <StatusBadge status={item.status} label={item.value} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Signal History */}
        <div className="lg:col-span-2">
          <div className="card-premium h-full">
            <div className="panel-header">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                Histórico de Sinais
              </span>
              <span className="font-mono text-[10px]">{signalHistory.length} sinais</span>
            </div>
            <div className="overflow-auto">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Preço</th>
                    <th>Sinal</th>
                    <th>Confiança</th>
                    <th>Regime</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {signalHistory.map((row, i) => (
                    <tr key={i} className="animate-slide-in" style={{ animationDelay: `${i * 50}ms` }}>
                      <td className="text-muted-foreground">{row.ts}</td>
                      <td className="text-foreground">{row.price.toLocaleString("pt-BR")}</td>
                      <td>
                        <span className={`font-bold ${row.signal === "LONG" ? "text-bull" : row.signal === "SHORT" ? "text-bear" : "text-muted-foreground"}`}>
                          {row.signal}
                        </span>
                      </td>
                      <td>
                        <span className={row.confidence > 0.6 ? "text-bull" : "text-warning"}>
                          {(row.confidence * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="text-muted-foreground text-[10px]">{row.regime}</td>
                      <td>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          row.action === "Executado" ? "bg-bull-muted text-bull" :
                          row.action === "Bloqueado" ? "bg-bear-muted text-bear" :
                          "bg-secondary text-muted-foreground"
                        }`}>
                          {row.action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IAPage;
