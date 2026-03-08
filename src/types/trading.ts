// ============================================================
// TIPOS DO SISTEMA DE TRADING
// ============================================================

export type Timeframe = "M1" | "M5" | "M15" | "H1";

export type Direction = "LONG" | "SHORT" | "NEUTRAL";

export type Regime = "TRENDING" | "MEAN_REVERTING" | "VOLATILE" | "CALM";

export type VolRegime = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";

export type MetaState = "AGGRESSIVE" | "NORMAL" | "DEFENSIVE" | "OFF";

export type ModelType = "trend" | "scalp";

export type TradingMode = "PAPER" | "LIVE";

export interface CandleData {
  time: number; // Unix timestamp em segundos
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface AISignal {
  direction: Direction;
  probability: number; // 0-1
  contracts: number;
  regime: Regime;
  vol_regime: VolRegime;
  meta_state: MetaState;
  model_used: ModelType;
  reason: string;
  timestamp: string;
}

export interface Position {
  symbol: string;
  direction: Direction;
  entry_price: number;
  current_price: number;
  contracts: number;
  pnl: number;
  pnl_percent: number;
  opened_at: string;
}

export interface Trade {
  id: string;
  symbol: string;
  direction: Direction;
  entry_price: number;
  exit_price: number;
  contracts: number;
  pnl: number;
  opened_at: string;
  closed_at: string;
  model_used: ModelType;
}

export interface Asset {
  symbol: string;
  name: string;
  last_price: number;
  change: number;
  change_percent: number;
}

export interface EngineState {
  mode: TradingMode;
  active: boolean;
  symbol: string;
  timeframe: Timeframe;
  signal: AISignal | null;
  position: Position | null;
  session_pnl: number;
  trades_count: number;
}

export interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "SIGNAL";
  message: string;
}

export interface BackendConfig {
  version: string;
  mode: TradingMode;
  available_symbols: string[];
  available_timeframes: Timeframe[];
}
