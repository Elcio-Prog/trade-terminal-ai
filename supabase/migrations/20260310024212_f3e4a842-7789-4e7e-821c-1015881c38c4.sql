
DROP TABLE IF EXISTS public.continuous_renko_feature_vectors;

CREATE TABLE public.continuous_renko_feature_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_symbol TEXT NOT NULL,
  source_timeframe TEXT NOT NULL DEFAULT 'M1',
  brick_size INTEGER NOT NULL,
  brick_index BIGINT NOT NULL,
  ts_reference TIMESTAMPTZ NOT NULL,
  feature_set_version TEXT NOT NULL DEFAULT 'renko_v1',
  source_row_id UUID,
  direction TEXT NOT NULL,
  dir_value INTEGER NOT NULL,
  same_dir_seq_count INTEGER,
  reversal_flag BOOLEAN,
  net_move_3 INTEGER,
  net_move_5 INTEGER,
  net_move_10 INTEGER,
  up_count_5 INTEGER,
  down_count_5 INTEGER,
  up_count_10 INTEGER,
  down_count_10 INTEGER,
  brick_return_1 NUMERIC(18,8),
  brick_return_3 NUMERIC(18,8),
  brick_return_5 NUMERIC(18,8),
  close_vs_ma_5 NUMERIC(18,8),
  close_vs_ma_10 NUMERIC(18,8),
  source_features_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (base_symbol, source_timeframe, brick_size, brick_index, feature_set_version)
);

CREATE INDEX IF NOT EXISTS idx_continuous_renko_feature_vectors_lookup
  ON public.continuous_renko_feature_vectors
  (base_symbol, source_timeframe, brick_size, brick_index DESC);

ALTER TABLE public.continuous_renko_feature_vectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY continuous_renko_feature_vectors_select_authenticated
  ON public.continuous_renko_feature_vectors
  FOR SELECT
  TO authenticated
  USING (true);
