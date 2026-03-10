CREATE TABLE IF NOT EXISTS public.continuous_feature_vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_symbol TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    ts_reference TIMESTAMPTZ NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('time', 'renko')),
    source_table TEXT NOT NULL,
    source_row_id UUID,
    feature_set_version TEXT NOT NULL DEFAULT 'cont_v1',
    ret_1 NUMERIC(18,8),
    ret_3 NUMERIC(18,8),
    ret_5 NUMERIC(18,8),
    ret_10 NUMERIC(18,8),
    range_points NUMERIC(18,8),
    body_points NUMERIC(18,8),
    upper_wick NUMERIC(18,8),
    lower_wick NUMERIC(18,8),
    close_vs_prev_close NUMERIC(18,8),
    close_vs_ma_9 NUMERIC(18,8),
    close_vs_ma_20 NUMERIC(18,8),
    vol_mean_5 NUMERIC(18,8),
    vol_mean_20 NUMERIC(18,8),
    rolling_high_20_dist NUMERIC(18,8),
    rolling_low_20_dist NUMERIC(18,8),
    up_seq_count INTEGER,
    down_seq_count INTEGER,
    source_features_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (base_symbol, timeframe, source_type, ts_reference, feature_set_version)
);

CREATE INDEX IF NOT EXISTS idx_continuous_feature_vectors_lookup
    ON public.continuous_feature_vectors (base_symbol, timeframe, source_type, ts_reference DESC);

ALTER TABLE public.continuous_feature_vectors ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'continuous_feature_vectors'
          AND policyname = 'continuous_feature_vectors_select_authenticated'
    ) THEN
        CREATE POLICY continuous_feature_vectors_select_authenticated
        ON public.continuous_feature_vectors
        FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END $$;