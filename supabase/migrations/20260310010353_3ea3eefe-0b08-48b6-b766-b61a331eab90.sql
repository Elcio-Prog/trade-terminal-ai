CREATE TABLE IF NOT EXISTS public.continuous_market_renko (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_symbol TEXT NOT NULL,
    source_timeframe TEXT NOT NULL DEFAULT 'M1',
    brick_size INTEGER NOT NULL,
    brick_index BIGINT,
    ts_open TIMESTAMPTZ NOT NULL,
    ts_close TIMESTAMPTZ NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('up', 'down')),
    open NUMERIC(18,8) NOT NULL,
    high NUMERIC(18,8) NOT NULL,
    low NUMERIC(18,8) NOT NULL,
    close NUMERIC(18,8) NOT NULL,
    source_open_ts TIMESTAMPTZ,
    source_close_ts TIMESTAMPTZ,
    source_row_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (base_symbol, source_timeframe, brick_size, brick_index)
);

CREATE INDEX IF NOT EXISTS idx_continuous_market_renko_lookup
    ON public.continuous_market_renko (base_symbol, source_timeframe, brick_size, ts_open DESC);

ALTER TABLE public.continuous_market_renko ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'continuous_market_renko'
          AND policyname = 'continuous_market_renko_select_authenticated'
    ) THEN
        CREATE POLICY continuous_market_renko_select_authenticated
        ON public.continuous_market_renko
        FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END $$;