
create table if not exists ml_training_data (
    id bigserial primary key,
    ts_ref timestamptz not null,
    base_symbol text not null,
    timeframe text not null default 'M1',
    source_type text not null default 'continuous_market_candles',
    source_id bigint,
    open numeric,
    high numeric,
    low numeric,
    close numeric,
    price numeric,
    volume numeric,
    return_1 numeric,
    return_3 numeric,
    return_5 numeric,
    range numeric,
    body numeric,
    upper_wick numeric,
    lower_wick numeric,
    ema9 numeric,
    ema21 numeric,
    ema200 numeric,
    vwap numeric,
    distance_vwap_points numeric,
    distance_vwap_pct numeric,
    vwap_std numeric,
    vwap_upper_1 numeric,
    vwap_lower_1 numeric,
    vwap_upper_2 numeric,
    vwap_lower_2 numeric,
    rsi numeric,
    macd numeric,
    macd_signal numeric,
    macd_hist numeric,
    adx numeric,
    atr numeric,
    volume_mean numeric,
    relative_volume numeric,
    volume_delta numeric,
    order_flow_imbalance numeric,
    renko_dir integer,
    renko_streak integer,
    renko_brick_size integer,
    liquidity_zone_id integer,
    liquidity_zone_center numeric,
    liquidity_zone_distance numeric,
    liquidity_zone_strength numeric,
    future_return_3 numeric,
    future_return_5 numeric,
    future_return_10 numeric,
    target_class integer,
    target_binary integer,
    regime_label text,
    created_at timestamptz not null default now()
);

create index if not exists idx_ml_training_data_ts_ref on ml_training_data (ts_ref);
create index if not exists idx_ml_training_data_symbol_tf on ml_training_data (base_symbol, timeframe, ts_ref);
create index if not exists idx_ml_training_data_target_class on ml_training_data (target_class);
create unique index if not exists ux_ml_training_data_symbol_tf_ts on ml_training_data (base_symbol, timeframe, ts_ref);

alter table ml_training_data enable row level security;

create policy "anon_select_ml_training_data" on ml_training_data for select to anon using (true);
create policy "authenticated_select_ml_training_data" on ml_training_data for select to authenticated using (true);
