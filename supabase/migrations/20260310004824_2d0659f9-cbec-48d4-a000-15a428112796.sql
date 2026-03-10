CREATE TABLE IF NOT EXISTS public.continuous_market_candles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_symbol TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    ts_open TIMESTAMPTZ NOT NULL,
    ts_close TIMESTAMPTZ NOT NULL,
    source_instrument_id UUID REFERENCES public.instruments(id),
    source_symbol TEXT NOT NULL,
    roll_method TEXT NOT NULL DEFAULT 'calendar_priority',
    seq_no BIGINT,
    open NUMERIC(18,8) NOT NULL,
    high NUMERIC(18,8) NOT NULL,
    low NUMERIC(18,8) NOT NULL,
    close NUMERIC(18,8) NOT NULL,
    volume NUMERIC(18,8),
    trade_count INTEGER,
    vwap NUMERIC(18,8),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (base_symbol, timeframe, ts_open)
);

CREATE INDEX IF NOT EXISTS idx_continuous_market_candles_lookup
    ON public.continuous_market_candles (base_symbol, timeframe, ts_open DESC);

ALTER TABLE public.continuous_market_candles ENABLE ROW LEVEL SECURITY;

CREATE POLICY continuous_market_candles_select_authenticated
ON public.continuous_market_candles
FOR SELECT
TO authenticated
USING (true);