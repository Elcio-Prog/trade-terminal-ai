import { useState } from "react";
import { SystemStatusBar } from "@/components/dashboard/SystemStatusBar";
import { CandleChartPanel } from "@/components/dashboard/CandleChartPanel";
import { RenkoChartPanel } from "@/components/dashboard/RenkoChartPanel";
import { MarketSummaryPanel } from "@/components/dashboard/MarketSummaryPanel";
import { BarChart3, Blocks } from "lucide-react";

type ChartTab = "candles" | "renko";

const Dashboard = () => {
  const [activeChart, setActiveChart] = useState<ChartTab>("candles");

  return (
    <div className="h-screen flex flex-col bg-terminal-bg overflow-hidden">
      {/* System Status Bar */}
      <SystemStatusBar />

      {/* Market Summary Cards */}
      <MarketSummaryPanel />

      {/* Chart Tabs */}
      <div className="flex-1 flex flex-col min-h-0 mx-3 mb-3 border border-border rounded-sm overflow-hidden bg-card">
        {/* Tab Bar */}
        <div className="flex border-b border-border bg-card">
          <button
            onClick={() => setActiveChart("candles")}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-mono font-medium uppercase tracking-wider transition-colors ${
              activeChart === "candles"
                ? "text-primary border-b-2 border-primary bg-secondary/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Candles
          </button>
          <button
            onClick={() => setActiveChart("renko")}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-mono font-medium uppercase tracking-wider transition-colors ${
              activeChart === "renko"
                ? "text-primary border-b-2 border-primary bg-secondary/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Blocks className="h-3.5 w-3.5" />
            Renko
          </button>
        </div>

        {/* Chart Content */}
        <div className="flex-1 min-h-0">
          {activeChart === "candles" ? <CandleChartPanel /> : <RenkoChartPanel />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
