ALTER TABLE public.continuous_renko_feature_vectors
ADD COLUMN IF NOT EXISTS brick_index BIGINT;

DROP INDEX IF EXISTS idx_continuous_renko_feature_vectors_lookup;

ALTER TABLE public.continuous_renko_feature_vectors
DROP CONSTRAINT IF EXISTS continuous_renko_feature_vectors_base_symbol_source_timeframe_b_key;

ALTER TABLE public.continuous_renko_feature_vectors
ADD CONSTRAINT continuous_renko_feature_vectors_unique_brick
UNIQUE (base_symbol, source_timeframe, brick_size, brick_index, feature_set_version);

CREATE INDEX IF NOT EXISTS idx_continuous_renko_feature_vectors_lookup
    ON public.continuous_renko_feature_vectors (base_symbol, source_timeframe, brick_size, brick_index DESC);