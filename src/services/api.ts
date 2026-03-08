// ============================================================
// SERVIÇO DE API - CONEXÃO COM BACKEND FASTAPI
// ============================================================
// 
// ⚠️  ALTERE A URL ABAIXO PARA O ENDEREÇO DO SEU BACKEND:
//     Ex: "http://localhost:8000" ou "http://192.168.1.100:8000"
//
const API_BASE_URL = "http://localhost:8000";
// ============================================================

import type {
  CandleData,
  EngineState,
  BackendConfig,
  AISignal,
  Position,
  Trade,
  Asset,
  LogEntry,
  Timeframe,
} from "@/types/trading";

// ============================================================
// CLIENTE HTTP
// ============================================================

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
  return res.json();
}

// ============================================================
// ENDPOINTS REAIS (para quando o backend estiver rodando)
// ============================================================

export const api = {
  /** GET /health */
  health: () => fetchAPI<{ status: string }>("/health"),

  /** GET /config */
  config: () => fetchAPI<BackendConfig>("/config"),

  /** GET /state */
  state: () => fetchAPI<EngineState>("/state"),

  /** POST /engine/run-once */
  runOnce: () => fetchAPI<EngineState>("/engine/run-once", { method: "POST" }),

  /** GET /chart?symbol=X&timeframe=Y&limit=Z */
  chart: (symbol: string, timeframe: Timeframe, limit = 300) =>
    fetchAPI<CandleData[]>(`/chart?symbol=${symbol}&timeframe=${timeframe}&limit=${limit}`),
};

// ============================================================
// DADOS MOCKADOS (para desenvolvimento sem backend)
// ============================================================

function generateMockCandles(count: number, basePrice: number): CandleData[] {
  const candles: CandleData[] = [];
  let price = basePrice;
  const now = Math.floor(Date.now() / 1000);

  for (let i = count; i > 0; i--) {
    const volatility = price * 0.003;
    const open = price;
    const close = open + (Math.random() - 0.48) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;

    candles.push({
      time: now - i * 60,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: Math.floor(Math.random() * 5000 + 500),
    });
    price = close;
  }
  return candles;
}

export const mockData = {
  candles: generateMockCandles(300, 130250),

  assets: [
    { symbol: "WINJ26", name: "Mini Índice Jun/26", last_price: 130250, change: 450, change_percent: 0.35 },
    { symbol: "WDOJ26", name: "Mini Dólar Jun/26", last_price: 5142.5, change: -12.5, change_percent: -0.24 },
    { symbol: "PETR4", name: "Petrobras PN", last_price: 38.72, change: 0.45, change_percent: 1.18 },
    { symbol: "VALE3", name: "Vale ON", last_price: 62.15, change: -0.83, change_percent: -1.32 },
    { symbol: "ITUB4", name: "Itaú Unibanco PN", last_price: 32.40, change: 0.18, change_percent: 0.56 },
    { symbol: "BBDC4", name: "Bradesco PN", last_price: 14.85, change: -0.12, change_percent: -0.80 },
  ] as Asset[],

  signal: {
    direction: "LONG",
    probability: 0.73,
    contracts: 2,
    regime: "TRENDING",
    vol_regime: "MEDIUM",
    meta_state: "NORMAL",
    model_used: "trend",
    reason: "Breakout confirmado acima da EMA21 com volume crescente. Regime trending detectado com volatilidade controlada.",
    timestamp: new Date().toISOString(),
  } as AISignal,

  position: {
    symbol: "WINJ26",
    direction: "LONG",
    entry_price: 130180,
    current_price: 130250,
    contracts: 2,
    pnl: 140,
    pnl_percent: 0.054,
    opened_at: new Date(Date.now() - 15 * 60000).toISOString(),
  } as Position,

  trades: [
    { id: "1", symbol: "WINJ26", direction: "LONG", entry_price: 129850, exit_price: 130050, contracts: 2, pnl: 400, opened_at: "2026-03-08T10:15:00", closed_at: "2026-03-08T10:32:00", model_used: "trend" },
    { id: "2", symbol: "WINJ26", direction: "SHORT", entry_price: 130100, exit_price: 130020, contracts: 1, pnl: 80, opened_at: "2026-03-08T11:05:00", closed_at: "2026-03-08T11:18:00", model_used: "scalp" },
    { id: "3", symbol: "WDOJ26", direction: "LONG", entry_price: 5135, exit_price: 5128, contracts: 3, pnl: -210, opened_at: "2026-03-08T11:45:00", closed_at: "2026-03-08T12:02:00", model_used: "trend" },
    { id: "4", symbol: "WINJ26", direction: "LONG", entry_price: 130000, exit_price: 130180, contracts: 2, pnl: 360, opened_at: "2026-03-08T13:10:00", closed_at: "2026-03-08T13:28:00", model_used: "trend" },
  ] as Trade[],

  logs: [
    { timestamp: "2026-03-08T13:30:01", level: "INFO", message: "Engine inicializado — modo PAPER" },
    { timestamp: "2026-03-08T13:30:02", level: "INFO", message: "Conectado ao feed de dados WINJ26 M5" },
    { timestamp: "2026-03-08T13:30:05", level: "SIGNAL", message: "Sinal LONG detectado — prob 0.73 — trend model" },
    { timestamp: "2026-03-08T13:30:06", level: "INFO", message: "Ordem PAPER enviada: BUY 2 WINJ26 @ 130180" },
    { timestamp: "2026-03-08T13:35:00", level: "INFO", message: "Posição atualizada: PnL +R$140.00" },
    { timestamp: "2026-03-08T13:40:00", level: "WARN", message: "Volatilidade subindo — vol_regime: MEDIUM → HIGH" },
  ] as LogEntry[],

  engineState: {
    mode: "PAPER",
    active: true,
    symbol: "WINJ26",
    timeframe: "M5",
    signal: null,
    position: null,
    session_pnl: 770,
    trades_count: 4,
  } as EngineState,
};
