import { useState } from "react";
import type { Timeframe } from "@/types/trading";
import { mockData } from "@/services/api";
import { useHealthCheck, useConfig, useEngineState, useChartData, useRunOnce } from "@/hooks/useTrading";
import { HeaderBar } from "@/components/trading/HeaderBar";
import { Watchlist } from "@/components/trading/Watchlist";
import { CandlestickChart } from "@/components/trading/CandlestickChart";
import { AISignalPanel } from "@/components/trading/AISignalPanel";
import { PositionPanel } from "@/components/trading/PositionPanel";
import { TradeHistory } from "@/components/trading/TradeHistory";
import { LogsPanel } from "@/components/trading/LogsPanel";
import { Play, Loader2 } from "lucide-react";

const Index = () => {
  const [selectedSymbol, setSelectedSymbol] = useState("WINJ26");
  const [timeframe, setTimeframe] = useState<Timeframe>("M5");
  const [activeBottomTab, setActiveBottomTab] = useState<"trades" | "logs">("trades");

  // ── API hooks ──
  const connected = useHealthCheck(8_000);
  const config = useConfig();
  const { state } = useEngineState(3_000);
  const { candles } = useChartData(selectedSymbol, timeframe);
  const { execute: runOnce, running } = useRunOnce();

  // Derive data — fallback to mocks when backend is offline
  const signal = state.signal ?? mockData.signal;
  const position = state.position ?? mockData.position;
  const trades = (state as any).trades ?? mockData.trades;
  const logs = (state as any).logs ?? mockData.logs;
  const mode = state.mode ?? "PAPER";

  return (
    <div className="h-screen flex flex-col bg-terminal-bg overflow-hidden">
      {/* Header */}
      <HeaderBar
        symbol={selectedSymbol}
        timeframe={timeframe}
        mode={mode}
        connected={connected}
        onTimeframeChange={setTimeframe}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Watchlist */}
        <aside className="w-52 border-r border-border shrink-0">
          <Watchlist
            assets={mockData.assets}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
          />
        </aside>

        {/* Center - Chart + Bottom Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chart */}
          <div className="flex-1 min-h-0">
            <CandlestickChart data={candles} />
          </div>

          {/* Bottom Panel - Trades/Logs */}
          <div className="h-52 border-t border-border flex flex-col shrink-0">
            <div className="flex border-b border-border bg-card">
              <button
                onClick={() => setActiveBottomTab("trades")}
                className={`px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                  activeBottomTab === "trades"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Histórico de Trades
              </button>
              <button
                onClick={() => setActiveBottomTab("logs")}
                className={`px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                  activeBottomTab === "logs"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Logs
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {activeBottomTab === "trades" ? (
                <TradeHistory trades={trades} />
              ) : (
                <LogsPanel logs={logs} />
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - AI Signal + Position + Run Button */}
        <aside className="w-72 border-l border-border shrink-0 overflow-y-auto scrollbar-thin">
          <div className="space-y-0">
            {/* Botão Rodar IA */}
            <div className="p-3 border-b border-border">
              <button
                onClick={runOnce}
                disabled={running}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm font-mono text-xs font-bold uppercase tracking-wider transition-all bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {running ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                {running ? "Processando…" : "Rodar IA Agora"}
              </button>
            </div>

            <AISignalPanel signal={signal} />
            <PositionPanel
              position={position}
              sessionPnl={state.session_pnl}
              tradesCount={state.trades_count}
            />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Index;
