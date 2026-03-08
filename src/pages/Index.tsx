import { useState } from "react";
import type { Timeframe } from "@/types/trading";
import { mockData } from "@/services/api";
import { HeaderBar } from "@/components/trading/HeaderBar";
import { Watchlist } from "@/components/trading/Watchlist";
import { CandlestickChart } from "@/components/trading/CandlestickChart";
import { AISignalPanel } from "@/components/trading/AISignalPanel";
import { PositionPanel } from "@/components/trading/PositionPanel";
import { TradeHistory } from "@/components/trading/TradeHistory";
import { LogsPanel } from "@/components/trading/LogsPanel";

const Index = () => {
  const [selectedSymbol, setSelectedSymbol] = useState("WINJ26");
  const [timeframe, setTimeframe] = useState<Timeframe>("M5");
  const [activeBottomTab, setActiveBottomTab] = useState<"trades" | "logs">("trades");

  return (
    <div className="h-screen flex flex-col bg-terminal-bg overflow-hidden">
      {/* Header */}
      <HeaderBar
        symbol={selectedSymbol}
        timeframe={timeframe}
        mode="PAPER"
        connected={true}
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
            <CandlestickChart data={mockData.candles} />
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
                <TradeHistory trades={mockData.trades} />
              ) : (
                <LogsPanel logs={mockData.logs} />
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - AI Signal + Position */}
        <aside className="w-72 border-l border-border shrink-0 overflow-y-auto scrollbar-thin">
          <div className="space-y-0">
            <AISignalPanel signal={mockData.signal} />
            <PositionPanel
              position={mockData.position}
              sessionPnl={mockData.engineState.session_pnl}
              tradesCount={mockData.engineState.trades_count}
            />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Index;
