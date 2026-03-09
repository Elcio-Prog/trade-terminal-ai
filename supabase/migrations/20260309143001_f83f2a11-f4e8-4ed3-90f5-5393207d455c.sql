
-- Extensões
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ENUMS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'env_mode') THEN
        CREATE TYPE env_mode AS ENUM ('replay', 'backtest', 'paper', 'live');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signal_side') THEN
        CREATE TYPE signal_side AS ENUM ('buy', 'sell', 'neutral');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entry_type_enum') THEN
        CREATE TYPE entry_type_enum AS ENUM ('market', 'limit', 'stop', 'none');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'execution_status_enum') THEN
        CREATE TYPE execution_status_enum AS ENUM (
            'pending', 'approved', 'rejected', 'sent', 'filled',
            'partial', 'cancelled', 'closed', 'error'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'market_regime_enum') THEN
        CREATE TYPE market_regime_enum AS ENUM (
            'trend_up', 'trend_down', 'range', 'breakout_up',
            'breakout_down', 'reversal_up', 'reversal_down', 'indecision'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_score_enum') THEN
        CREATE TYPE feedback_score_enum AS ENUM ('+2', '+1', '-1');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_label_enum') THEN
        CREATE TYPE feedback_label_enum AS ENUM ('excelente', 'boa', 'ruim');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_side_enum') THEN
        CREATE TYPE order_side_enum AS ENUM ('buy', 'sell');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_type_enum') THEN
        CREATE TYPE order_type_enum AS ENUM ('market', 'limit', 'stop', 'close');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_phase_enum') THEN
        CREATE TYPE session_phase_enum AS ENUM (
            'pre_market', 'opening', 'morning', 'midday',
            'afternoon', 'closing', 'after_market'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'outcome_label_enum') THEN
        CREATE TYPE outcome_label_enum AS ENUM (
            'hit_target', 'stopped', 'partial', 'breakeven',
            'no_followthrough', 'open', 'manual_close'
        );
    END IF;
END $$;

-- METADADOS
CREATE TABLE IF NOT EXISTS schema_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key TEXT NOT NULL,
    environment env_mode NOT NULL,
    value_json JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (config_key, environment)
);

-- INSTRUMENTOS
CREATE TABLE IF NOT EXISTS instruments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL UNIQUE,
    base_symbol TEXT NOT NULL,
    exchange TEXT NOT NULL DEFAULT 'B3',
    asset_class TEXT NOT NULL DEFAULT 'FUT',
    currency TEXT NOT NULL DEFAULT 'BRL',
    tick_size NUMERIC(18,8) NOT NULL,
    tick_value NUMERIC(18,8) NOT NULL,
    contract_multiplier NUMERIC(18,8) NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SESSÕES DE MERCADO
CREATE TABLE IF NOT EXISTS market_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instrument_id UUID NOT NULL REFERENCES instruments(id),
    session_date DATE NOT NULL,
    session_type TEXT NOT NULL DEFAULT 'regular',
    status TEXT NOT NULL DEFAULT 'open',
    open_time TIMESTAMPTZ,
    close_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (instrument_id, session_date, session_type)
);

-- CANDLES
CREATE TABLE IF NOT EXISTS market_candles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instrument_id UUID NOT NULL REFERENCES instruments(id),
    timeframe TEXT NOT NULL,
    ts_open TIMESTAMPTZ NOT NULL,
    ts_close TIMESTAMPTZ NOT NULL,
    open NUMERIC(18,8) NOT NULL,
    high NUMERIC(18,8) NOT NULL,
    low NUMERIC(18,8) NOT NULL,
    close NUMERIC(18,8) NOT NULL,
    volume NUMERIC(18,8),
    trade_count INTEGER,
    vwap NUMERIC(18,8),
    source TEXT NOT NULL DEFAULT 'mt5',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (instrument_id, timeframe, ts_open)
);

CREATE INDEX IF NOT EXISTS idx_market_candles_lookup ON market_candles (instrument_id, timeframe, ts_open DESC);
CREATE INDEX IF NOT EXISTS idx_market_candles_close ON market_candles (ts_close DESC);

-- SNAPSHOTS DE MERCADO
CREATE TABLE IF NOT EXISTS market_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instrument_id UUID NOT NULL REFERENCES instruments(id),
    ts_event TIMESTAMPTZ NOT NULL,
    bid NUMERIC(18,8),
    ask NUMERIC(18,8),
    last_price NUMERIC(18,8) NOT NULL,
    spread NUMERIC(18,8),
    mid_price NUMERIC(18,8),
    agg_volume NUMERIC(18,8),
    buy_pressure NUMERIC(18,8),
    sell_pressure NUMERIC(18,8),
    imbalance NUMERIC(18,8),
    microtrend NUMERIC(18,8),
    source TEXT NOT NULL DEFAULT 'mt5',
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_snapshots_instrument_ts ON market_snapshots (instrument_id, ts_event DESC);

-- FEATURE VECTORS
CREATE TABLE IF NOT EXISTS feature_vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instrument_id UUID NOT NULL REFERENCES instruments(id),
    ts_reference TIMESTAMPTZ NOT NULL,
    timeframe TEXT NOT NULL,
    feature_set_version TEXT NOT NULL,
    session_phase session_phase_enum,
    rsi_14 NUMERIC(18,8),
    macd_line NUMERIC(18,8),
    macd_signal NUMERIC(18,8),
    atr_14 NUMERIC(18,8),
    vwap NUMERIC(18,8),
    vwap_distance NUMERIC(18,8),
    candle_body NUMERIC(18,8),
    upper_wick NUMERIC(18,8),
    lower_wick NUMERIC(18,8),
    range_points NUMERIC(18,8),
    volume_zscore NUMERIC(18,8),
    momentum_3 NUMERIC(18,8),
    momentum_5 NUMERIC(18,8),
    momentum_10 NUMERIC(18,8),
    trend_strength NUMERIC(18,8),
    pullback_strength NUMERIC(18,8),
    breakout_strength NUMERIC(18,8),
    volatility_regime NUMERIC(18,8),
    opening_range_position NUMERIC(18,8),
    features_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (instrument_id, timeframe, ts_reference, feature_set_version)
);

CREATE INDEX IF NOT EXISTS idx_feature_vectors_lookup ON feature_vectors (instrument_id, timeframe, ts_reference DESC);

-- REGIME DE MERCADO
CREATE TABLE IF NOT EXISTS market_regimes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instrument_id UUID NOT NULL REFERENCES instruments(id),
    feature_vector_id UUID REFERENCES feature_vectors(id),
    ts_reference TIMESTAMPTZ NOT NULL,
    regime_label market_regime_enum NOT NULL,
    confidence NUMERIC(8,6) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    rationale TEXT,
    model_version TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_regimes_lookup ON market_regimes (instrument_id, ts_reference DESC);

-- AI ANALYSIS LOGS
CREATE TABLE IF NOT EXISTS ai_analysis_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instrument_id UUID NOT NULL REFERENCES instruments(id),
    ts_reference TIMESTAMPTZ NOT NULL,
    timeframe TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    model_version TEXT,
    input_context_json JSONB NOT NULL,
    output_text TEXT,
    output_structured_json JSONB,
    latency_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_logs_lookup ON ai_analysis_logs (instrument_id, ts_reference DESC);

-- AI SIGNALS
CREATE TABLE IF NOT EXISTS ai_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instrument_id UUID NOT NULL REFERENCES instruments(id),
    feature_vector_id UUID REFERENCES feature_vectors(id),
    regime_id UUID REFERENCES market_regimes(id),
    analysis_log_id UUID REFERENCES ai_analysis_logs(id),
    ts_signal TIMESTAMPTZ NOT NULL,
    environment env_mode NOT NULL,
    side signal_side NOT NULL,
    signal_strength INTEGER NOT NULL DEFAULT 0 CHECK (signal_strength >= 0 AND signal_strength <= 100),
    confidence_score NUMERIC(8,6) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    should_trade BOOLEAN NOT NULL DEFAULT FALSE,
    entry_type entry_type_enum NOT NULL DEFAULT 'none',
    entry_price NUMERIC(18,8),
    stop_price NUMERIC(18,8),
    take_price NUMERIC(18,8),
    invalidation_price NUMERIC(18,8),
    rr_ratio NUMERIC(18,8),
    thesis TEXT,
    main_risk TEXT,
    analyst_rationale TEXT,
    prompt_version TEXT NOT NULL,
    model_version TEXT,
    strategy_version TEXT,
    execution_status execution_status_enum NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_signals_lookup ON ai_signals (instrument_id, ts_signal DESC);
CREATE INDEX IF NOT EXISTS idx_ai_signals_env_status ON ai_signals (environment, execution_status, ts_signal DESC);

-- EXECUTION COMMANDS
CREATE TABLE IF NOT EXISTS execution_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_id UUID REFERENCES ai_signals(id),
    instrument_id UUID NOT NULL REFERENCES instruments(id),
    environment env_mode NOT NULL,
    command_type TEXT NOT NULL,
    payload_json JSONB NOT NULL,
    status execution_status_enum NOT NULL DEFAULT 'pending',
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_execution_commands_status ON execution_commands (environment, status, created_at ASC);

-- TRADE ORDERS
CREATE TABLE IF NOT EXISTS trade_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_id UUID REFERENCES ai_signals(id),
    command_id UUID REFERENCES execution_commands(id),
    instrument_id UUID NOT NULL REFERENCES instruments(id),
    broker_env env_mode NOT NULL,
    order_side order_side_enum NOT NULL,
    order_type order_type_enum NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    requested_price NUMERIC(18,8),
    executed_price NUMERIC(18,8),
    stop_price NUMERIC(18,8),
    take_price NUMERIC(18,8),
    close_price NUMERIC(18,8),
    status execution_status_enum NOT NULL DEFAULT 'pending',
    mt5_ticket TEXT,
    slippage_points NUMERIC(18,8),
    gross_pnl_points NUMERIC(18,8),
    gross_pnl_brl NUMERIC(18,8),
    fees_brl NUMERIC(18,8),
    net_pnl_brl NUMERIC(18,8),
    execution_notes TEXT,
    sent_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trade_orders_signal ON trade_orders (signal_id);
CREATE INDEX IF NOT EXISTS idx_trade_orders_status ON trade_orders (broker_env, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_orders_ticket ON trade_orders (mt5_ticket);

-- ACCOUNT SNAPSHOTS
CREATE TABLE IF NOT EXISTS account_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment env_mode NOT NULL,
    broker_name TEXT,
    account_id TEXT,
    ts_event TIMESTAMPTZ NOT NULL,
    balance NUMERIC(18,8),
    equity NUMERIC(18,8),
    margin_used NUMERIC(18,8),
    free_margin NUMERIC(18,8),
    daily_pnl_brl NUMERIC(18,8),
    open_positions INTEGER,
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_snapshots_env_ts ON account_snapshots (environment, ts_event DESC);

-- POSITION SNAPSHOTS
CREATE TABLE IF NOT EXISTS position_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instrument_id UUID NOT NULL REFERENCES instruments(id),
    environment env_mode NOT NULL,
    ts_event TIMESTAMPTZ NOT NULL,
    net_quantity INTEGER NOT NULL DEFAULT 0,
    avg_price NUMERIC(18,8),
    unrealized_pnl_brl NUMERIC(18,8),
    realized_pnl_brl NUMERIC(18,8),
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_position_snapshots_lookup ON position_snapshots (instrument_id, environment, ts_event DESC);

-- SIGNAL OUTCOMES
CREATE TABLE IF NOT EXISTS signal_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_id UUID NOT NULL UNIQUE REFERENCES ai_signals(id) ON DELETE CASCADE,
    horizon_minutes INTEGER NOT NULL,
    max_favorable_excursion NUMERIC(18,8),
    max_adverse_excursion NUMERIC(18,8),
    close_after_horizon NUMERIC(18,8),
    outcome_label outcome_label_enum NOT NULL,
    outcome_score NUMERIC(18,8),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SIGNAL FEEDBACK
CREATE TABLE IF NOT EXISTS signal_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_id UUID NOT NULL REFERENCES ai_signals(id) ON DELETE CASCADE,
    feedback_score feedback_score_enum NOT NULL,
    feedback_label feedback_label_enum NOT NULL,
    timing_quality INTEGER CHECK (timing_quality BETWEEN 1 AND 5),
    direction_quality INTEGER CHECK (direction_quality BETWEEN 1 AND 5),
    risk_quality INTEGER CHECK (risk_quality BETWEEN 1 AND 5),
    exit_quality INTEGER CHECK (exit_quality BETWEEN 1 AND 5),
    user_comment TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signal_feedback_signal ON signal_feedback (signal_id, created_at DESC);

-- SIGNAL LEARNING SCORES
CREATE TABLE IF NOT EXISTS signal_learning_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_id UUID NOT NULL UNIQUE REFERENCES ai_signals(id) ON DELETE CASCADE,
    human_score NUMERIC(18,8),
    outcome_score NUMERIC(18,8),
    execution_score NUMERIC(18,8),
    final_score NUMERIC(18,8),
    score_formula_version TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- BACKTEST RUNS
CREATE TABLE IF NOT EXISTS backtest_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    date_start TIMESTAMPTZ NOT NULL,
    date_end TIMESTAMPTZ NOT NULL,
    environment env_mode NOT NULL DEFAULT 'backtest',
    strategy_version TEXT NOT NULL,
    model_version TEXT,
    prompt_version TEXT,
    feature_set_version TEXT,
    config_json JSONB NOT NULL,
    total_trades INTEGER,
    wins INTEGER,
    losses INTEGER,
    win_rate NUMERIC(18,8),
    payoff NUMERIC(18,8),
    pnl_points NUMERIC(18,8),
    pnl_brl NUMERIC(18,8),
    max_drawdown NUMERIC(18,8),
    profit_factor NUMERIC(18,8),
    sharpe NUMERIC(18,8),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backtest_runs_symbol_date ON backtest_runs (symbol, created_at DESC);

-- BACKTEST TRADES
CREATE TABLE IF NOT EXISTS backtest_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backtest_run_id UUID NOT NULL REFERENCES backtest_runs(id) ON DELETE CASCADE,
    ts_entry TIMESTAMPTZ NOT NULL,
    ts_exit TIMESTAMPTZ,
    side signal_side NOT NULL,
    entry_price NUMERIC(18,8) NOT NULL,
    exit_price NUMERIC(18,8),
    stop_price NUMERIC(18,8),
    take_price NUMERIC(18,8),
    pnl_points NUMERIC(18,8),
    pnl_brl NUMERIC(18,8),
    regime_label market_regime_enum,
    features_json JSONB,
    rationale TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backtest_trades_run ON backtest_trades (backtest_run_id, ts_entry ASC);

-- ML DATASETS
CREATE TABLE IF NOT EXISTS ml_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_name TEXT NOT NULL,
    dataset_type TEXT NOT NULL,
    symbol TEXT,
    timeframe TEXT,
    date_start TIMESTAMPTZ,
    date_end TIMESTAMPTZ,
    feature_set_version TEXT,
    strategy_version TEXT,
    row_count INTEGER,
    target_definition TEXT,
    storage_ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ML MODELS
CREATE TABLE IF NOT EXISTS ml_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL,
    model_type TEXT NOT NULL,
    model_version TEXT NOT NULL,
    symbol TEXT,
    timeframe TEXT,
    feature_set_version TEXT,
    training_dataset_id UUID REFERENCES ml_datasets(id),
    metrics_json JSONB,
    artifact_ref TEXT,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (model_name, model_version)
);

-- SYSTEM EVENTS
CREATE TABLE IF NOT EXISTS system_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info',
    environment env_mode,
    reference_id UUID,
    message TEXT NOT NULL,
    payload_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_events_lookup ON system_events (created_at DESC);

-- BRIDGE AGENTS
CREATE TABLE IF NOT EXISTS bridge_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT NOT NULL UNIQUE,
    host_name TEXT,
    ip_address TEXT,
    app_version TEXT,
    status TEXT NOT NULL DEFAULT 'online',
    last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    capabilities_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE schema_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_candles ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_regimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_learning_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtest_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtest_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bridge_agents ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura para usuários autenticados (o backend local usa service_role key)
CREATE POLICY "Authenticated read all" ON schema_meta FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read all" ON system_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read all" ON instruments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read all" ON market_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read all" ON market_candles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read all" ON market_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read all" ON feature_vectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read all" ON market_regimes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read all" ON ai_analysis_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read all" ON ai_signals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read all" ON execution_commands FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read all" ON trade_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read all" ON account_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read all" ON position_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read all" ON signal_outcomes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read all" ON signal_feedback FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read all" ON signal_learning_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read all" ON backtest_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read all" ON backtest_trades FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read all" ON ml_datasets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read all" ON ml_models FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read all" ON system_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read all" ON bridge_agents FOR SELECT TO authenticated USING (true);

-- Service role (backend) pode tudo via service_role key automaticamente
