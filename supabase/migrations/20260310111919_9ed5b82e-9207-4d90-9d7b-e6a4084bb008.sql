
-- Add anon SELECT policy for market_candles (needed for contract mode)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'market_candles' AND policyname = 'anon_select_market_candles'
  ) THEN
    CREATE POLICY anon_select_market_candles ON public.market_candles FOR SELECT TO anon USING (true);
  END IF;
END $$;
