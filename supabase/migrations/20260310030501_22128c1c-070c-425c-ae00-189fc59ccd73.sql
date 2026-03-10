
-- Add PERMISSIVE SELECT policies for anon role on all market data tables

-- continuous_market_candles
CREATE POLICY "anon_select_continuous_market_candles"
  ON public.continuous_market_candles
  FOR SELECT
  TO anon
  USING (true);

-- continuous_market_renko
CREATE POLICY "anon_select_continuous_market_renko"
  ON public.continuous_market_renko
  FOR SELECT
  TO anon
  USING (true);

-- bridge_agents
CREATE POLICY "anon_select_bridge_agents"
  ON public.bridge_agents
  FOR SELECT
  TO anon
  USING (true);

-- Also add permissive policies for authenticated (the existing ones are RESTRICTIVE which blocks access)
-- Drop restrictive ones and recreate as permissive

DROP POLICY IF EXISTS "Authenticated read all" ON public.bridge_agents;
CREATE POLICY "authenticated_select_bridge_agents"
  ON public.bridge_agents
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "continuous_market_candles_select_authenticated" ON public.continuous_market_candles;
CREATE POLICY "authenticated_select_continuous_market_candles"
  ON public.continuous_market_candles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "continuous_market_renko_select_authenticated" ON public.continuous_market_renko;
CREATE POLICY "authenticated_select_continuous_market_renko"
  ON public.continuous_market_renko
  FOR SELECT
  TO authenticated
  USING (true);
