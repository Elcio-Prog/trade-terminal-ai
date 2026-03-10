export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      account_snapshots: {
        Row: {
          account_id: string | null
          balance: number | null
          broker_name: string | null
          created_at: string
          daily_pnl_brl: number | null
          environment: Database["public"]["Enums"]["env_mode"]
          equity: number | null
          free_margin: number | null
          id: string
          margin_used: number | null
          open_positions: number | null
          raw_payload: Json | null
          ts_event: string
        }
        Insert: {
          account_id?: string | null
          balance?: number | null
          broker_name?: string | null
          created_at?: string
          daily_pnl_brl?: number | null
          environment: Database["public"]["Enums"]["env_mode"]
          equity?: number | null
          free_margin?: number | null
          id?: string
          margin_used?: number | null
          open_positions?: number | null
          raw_payload?: Json | null
          ts_event: string
        }
        Update: {
          account_id?: string | null
          balance?: number | null
          broker_name?: string | null
          created_at?: string
          daily_pnl_brl?: number | null
          environment?: Database["public"]["Enums"]["env_mode"]
          equity?: number | null
          free_margin?: number | null
          id?: string
          margin_used?: number | null
          open_positions?: number | null
          raw_payload?: Json | null
          ts_event?: string
        }
        Relationships: []
      }
      ai_analysis_logs: {
        Row: {
          created_at: string
          id: string
          input_context_json: Json
          instrument_id: string
          latency_ms: number | null
          model_version: string | null
          output_structured_json: Json | null
          output_text: string | null
          prompt_version: string
          timeframe: string
          ts_reference: string
        }
        Insert: {
          created_at?: string
          id?: string
          input_context_json: Json
          instrument_id: string
          latency_ms?: number | null
          model_version?: string | null
          output_structured_json?: Json | null
          output_text?: string | null
          prompt_version: string
          timeframe: string
          ts_reference: string
        }
        Update: {
          created_at?: string
          id?: string
          input_context_json?: Json
          instrument_id?: string
          latency_ms?: number | null
          model_version?: string | null
          output_structured_json?: Json | null
          output_text?: string | null
          prompt_version?: string
          timeframe?: string
          ts_reference?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_logs_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_signals: {
        Row: {
          analysis_log_id: string | null
          analyst_rationale: string | null
          confidence_score: number
          created_at: string
          entry_price: number | null
          entry_type: Database["public"]["Enums"]["entry_type_enum"]
          environment: Database["public"]["Enums"]["env_mode"]
          execution_status: Database["public"]["Enums"]["execution_status_enum"]
          feature_vector_id: string | null
          id: string
          instrument_id: string
          invalidation_price: number | null
          main_risk: string | null
          model_version: string | null
          prompt_version: string
          regime_id: string | null
          rr_ratio: number | null
          should_trade: boolean
          side: Database["public"]["Enums"]["signal_side"]
          signal_strength: number
          stop_price: number | null
          strategy_version: string | null
          take_price: number | null
          thesis: string | null
          ts_signal: string
        }
        Insert: {
          analysis_log_id?: string | null
          analyst_rationale?: string | null
          confidence_score: number
          created_at?: string
          entry_price?: number | null
          entry_type?: Database["public"]["Enums"]["entry_type_enum"]
          environment: Database["public"]["Enums"]["env_mode"]
          execution_status?: Database["public"]["Enums"]["execution_status_enum"]
          feature_vector_id?: string | null
          id?: string
          instrument_id: string
          invalidation_price?: number | null
          main_risk?: string | null
          model_version?: string | null
          prompt_version: string
          regime_id?: string | null
          rr_ratio?: number | null
          should_trade?: boolean
          side: Database["public"]["Enums"]["signal_side"]
          signal_strength?: number
          stop_price?: number | null
          strategy_version?: string | null
          take_price?: number | null
          thesis?: string | null
          ts_signal: string
        }
        Update: {
          analysis_log_id?: string | null
          analyst_rationale?: string | null
          confidence_score?: number
          created_at?: string
          entry_price?: number | null
          entry_type?: Database["public"]["Enums"]["entry_type_enum"]
          environment?: Database["public"]["Enums"]["env_mode"]
          execution_status?: Database["public"]["Enums"]["execution_status_enum"]
          feature_vector_id?: string | null
          id?: string
          instrument_id?: string
          invalidation_price?: number | null
          main_risk?: string | null
          model_version?: string | null
          prompt_version?: string
          regime_id?: string | null
          rr_ratio?: number | null
          should_trade?: boolean
          side?: Database["public"]["Enums"]["signal_side"]
          signal_strength?: number
          stop_price?: number | null
          strategy_version?: string | null
          take_price?: number | null
          thesis?: string | null
          ts_signal?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_signals_analysis_log_id_fkey"
            columns: ["analysis_log_id"]
            isOneToOne: false
            referencedRelation: "ai_analysis_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_signals_feature_vector_id_fkey"
            columns: ["feature_vector_id"]
            isOneToOne: false
            referencedRelation: "feature_vectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_signals_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_signals_regime_id_fkey"
            columns: ["regime_id"]
            isOneToOne: false
            referencedRelation: "market_regimes"
            referencedColumns: ["id"]
          },
        ]
      }
      backtest_runs: {
        Row: {
          config_json: Json
          created_at: string
          date_end: string
          date_start: string
          environment: Database["public"]["Enums"]["env_mode"]
          feature_set_version: string | null
          id: string
          losses: number | null
          max_drawdown: number | null
          model_version: string | null
          name: string
          payoff: number | null
          pnl_brl: number | null
          pnl_points: number | null
          profit_factor: number | null
          prompt_version: string | null
          sharpe: number | null
          strategy_version: string
          symbol: string
          timeframe: string
          total_trades: number | null
          win_rate: number | null
          wins: number | null
        }
        Insert: {
          config_json: Json
          created_at?: string
          date_end: string
          date_start: string
          environment?: Database["public"]["Enums"]["env_mode"]
          feature_set_version?: string | null
          id?: string
          losses?: number | null
          max_drawdown?: number | null
          model_version?: string | null
          name: string
          payoff?: number | null
          pnl_brl?: number | null
          pnl_points?: number | null
          profit_factor?: number | null
          prompt_version?: string | null
          sharpe?: number | null
          strategy_version: string
          symbol: string
          timeframe: string
          total_trades?: number | null
          win_rate?: number | null
          wins?: number | null
        }
        Update: {
          config_json?: Json
          created_at?: string
          date_end?: string
          date_start?: string
          environment?: Database["public"]["Enums"]["env_mode"]
          feature_set_version?: string | null
          id?: string
          losses?: number | null
          max_drawdown?: number | null
          model_version?: string | null
          name?: string
          payoff?: number | null
          pnl_brl?: number | null
          pnl_points?: number | null
          profit_factor?: number | null
          prompt_version?: string | null
          sharpe?: number | null
          strategy_version?: string
          symbol?: string
          timeframe?: string
          total_trades?: number | null
          win_rate?: number | null
          wins?: number | null
        }
        Relationships: []
      }
      backtest_trades: {
        Row: {
          backtest_run_id: string
          created_at: string
          entry_price: number
          exit_price: number | null
          features_json: Json | null
          id: string
          pnl_brl: number | null
          pnl_points: number | null
          rationale: string | null
          regime_label: Database["public"]["Enums"]["market_regime_enum"] | null
          side: Database["public"]["Enums"]["signal_side"]
          stop_price: number | null
          take_price: number | null
          ts_entry: string
          ts_exit: string | null
        }
        Insert: {
          backtest_run_id: string
          created_at?: string
          entry_price: number
          exit_price?: number | null
          features_json?: Json | null
          id?: string
          pnl_brl?: number | null
          pnl_points?: number | null
          rationale?: string | null
          regime_label?:
            | Database["public"]["Enums"]["market_regime_enum"]
            | null
          side: Database["public"]["Enums"]["signal_side"]
          stop_price?: number | null
          take_price?: number | null
          ts_entry: string
          ts_exit?: string | null
        }
        Update: {
          backtest_run_id?: string
          created_at?: string
          entry_price?: number
          exit_price?: number | null
          features_json?: Json | null
          id?: string
          pnl_brl?: number | null
          pnl_points?: number | null
          rationale?: string | null
          regime_label?:
            | Database["public"]["Enums"]["market_regime_enum"]
            | null
          side?: Database["public"]["Enums"]["signal_side"]
          stop_price?: number | null
          take_price?: number | null
          ts_entry?: string
          ts_exit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backtest_trades_backtest_run_id_fkey"
            columns: ["backtest_run_id"]
            isOneToOne: false
            referencedRelation: "backtest_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      bridge_agents: {
        Row: {
          agent_name: string
          app_version: string | null
          capabilities_json: Json | null
          created_at: string
          host_name: string | null
          id: string
          ip_address: string | null
          last_heartbeat_at: string
          status: string
        }
        Insert: {
          agent_name: string
          app_version?: string | null
          capabilities_json?: Json | null
          created_at?: string
          host_name?: string | null
          id?: string
          ip_address?: string | null
          last_heartbeat_at?: string
          status?: string
        }
        Update: {
          agent_name?: string
          app_version?: string | null
          capabilities_json?: Json | null
          created_at?: string
          host_name?: string | null
          id?: string
          ip_address?: string | null
          last_heartbeat_at?: string
          status?: string
        }
        Relationships: []
      }
      continuous_feature_vectors: {
        Row: {
          base_symbol: string
          body_points: number | null
          close_vs_ma_20: number | null
          close_vs_ma_9: number | null
          close_vs_prev_close: number | null
          created_at: string
          down_seq_count: number | null
          feature_set_version: string
          id: string
          lower_wick: number | null
          range_points: number | null
          ret_1: number | null
          ret_10: number | null
          ret_3: number | null
          ret_5: number | null
          rolling_high_20_dist: number | null
          rolling_low_20_dist: number | null
          source_features_json: Json | null
          source_row_id: string | null
          source_table: string
          source_type: string
          timeframe: string
          ts_reference: string
          up_seq_count: number | null
          upper_wick: number | null
          vol_mean_20: number | null
          vol_mean_5: number | null
        }
        Insert: {
          base_symbol: string
          body_points?: number | null
          close_vs_ma_20?: number | null
          close_vs_ma_9?: number | null
          close_vs_prev_close?: number | null
          created_at?: string
          down_seq_count?: number | null
          feature_set_version?: string
          id?: string
          lower_wick?: number | null
          range_points?: number | null
          ret_1?: number | null
          ret_10?: number | null
          ret_3?: number | null
          ret_5?: number | null
          rolling_high_20_dist?: number | null
          rolling_low_20_dist?: number | null
          source_features_json?: Json | null
          source_row_id?: string | null
          source_table: string
          source_type: string
          timeframe: string
          ts_reference: string
          up_seq_count?: number | null
          upper_wick?: number | null
          vol_mean_20?: number | null
          vol_mean_5?: number | null
        }
        Update: {
          base_symbol?: string
          body_points?: number | null
          close_vs_ma_20?: number | null
          close_vs_ma_9?: number | null
          close_vs_prev_close?: number | null
          created_at?: string
          down_seq_count?: number | null
          feature_set_version?: string
          id?: string
          lower_wick?: number | null
          range_points?: number | null
          ret_1?: number | null
          ret_10?: number | null
          ret_3?: number | null
          ret_5?: number | null
          rolling_high_20_dist?: number | null
          rolling_low_20_dist?: number | null
          source_features_json?: Json | null
          source_row_id?: string | null
          source_table?: string
          source_type?: string
          timeframe?: string
          ts_reference?: string
          up_seq_count?: number | null
          upper_wick?: number | null
          vol_mean_20?: number | null
          vol_mean_5?: number | null
        }
        Relationships: []
      }
      continuous_market_candles: {
        Row: {
          base_symbol: string
          close: number
          created_at: string
          high: number
          id: string
          low: number
          open: number
          roll_method: string
          seq_no: number | null
          source_instrument_id: string | null
          source_symbol: string
          timeframe: string
          trade_count: number | null
          ts_close: string
          ts_open: string
          volume: number | null
          vwap: number | null
        }
        Insert: {
          base_symbol: string
          close: number
          created_at?: string
          high: number
          id?: string
          low: number
          open: number
          roll_method?: string
          seq_no?: number | null
          source_instrument_id?: string | null
          source_symbol: string
          timeframe: string
          trade_count?: number | null
          ts_close: string
          ts_open: string
          volume?: number | null
          vwap?: number | null
        }
        Update: {
          base_symbol?: string
          close?: number
          created_at?: string
          high?: number
          id?: string
          low?: number
          open?: number
          roll_method?: string
          seq_no?: number | null
          source_instrument_id?: string | null
          source_symbol?: string
          timeframe?: string
          trade_count?: number | null
          ts_close?: string
          ts_open?: string
          volume?: number | null
          vwap?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "continuous_market_candles_source_instrument_id_fkey"
            columns: ["source_instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      continuous_market_renko: {
        Row: {
          base_symbol: string
          brick_index: number | null
          brick_size: number
          close: number
          created_at: string
          direction: string
          high: number
          id: string
          low: number
          open: number
          source_close_ts: string | null
          source_open_ts: string | null
          source_row_count: number | null
          source_timeframe: string
          ts_close: string
          ts_open: string
        }
        Insert: {
          base_symbol: string
          brick_index?: number | null
          brick_size: number
          close: number
          created_at?: string
          direction: string
          high: number
          id?: string
          low: number
          open: number
          source_close_ts?: string | null
          source_open_ts?: string | null
          source_row_count?: number | null
          source_timeframe?: string
          ts_close: string
          ts_open: string
        }
        Update: {
          base_symbol?: string
          brick_index?: number | null
          brick_size?: number
          close?: number
          created_at?: string
          direction?: string
          high?: number
          id?: string
          low?: number
          open?: number
          source_close_ts?: string | null
          source_open_ts?: string | null
          source_row_count?: number | null
          source_timeframe?: string
          ts_close?: string
          ts_open?: string
        }
        Relationships: []
      }
      execution_commands: {
        Row: {
          acknowledged_at: string | null
          command_type: string
          created_at: string
          environment: Database["public"]["Enums"]["env_mode"]
          error_message: string | null
          finished_at: string | null
          id: string
          instrument_id: string
          payload_json: Json
          sent_at: string | null
          signal_id: string | null
          status: Database["public"]["Enums"]["execution_status_enum"]
        }
        Insert: {
          acknowledged_at?: string | null
          command_type: string
          created_at?: string
          environment: Database["public"]["Enums"]["env_mode"]
          error_message?: string | null
          finished_at?: string | null
          id?: string
          instrument_id: string
          payload_json: Json
          sent_at?: string | null
          signal_id?: string | null
          status?: Database["public"]["Enums"]["execution_status_enum"]
        }
        Update: {
          acknowledged_at?: string | null
          command_type?: string
          created_at?: string
          environment?: Database["public"]["Enums"]["env_mode"]
          error_message?: string | null
          finished_at?: string | null
          id?: string
          instrument_id?: string
          payload_json?: Json
          sent_at?: string | null
          signal_id?: string | null
          status?: Database["public"]["Enums"]["execution_status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "execution_commands_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_commands_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "ai_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_vectors: {
        Row: {
          atr_14: number | null
          breakout_strength: number | null
          candle_body: number | null
          created_at: string
          feature_set_version: string
          features_json: Json | null
          id: string
          instrument_id: string
          lower_wick: number | null
          macd_line: number | null
          macd_signal: number | null
          momentum_10: number | null
          momentum_3: number | null
          momentum_5: number | null
          opening_range_position: number | null
          pullback_strength: number | null
          range_points: number | null
          rsi_14: number | null
          session_phase:
            | Database["public"]["Enums"]["session_phase_enum"]
            | null
          timeframe: string
          trend_strength: number | null
          ts_reference: string
          upper_wick: number | null
          volatility_regime: number | null
          volume_zscore: number | null
          vwap: number | null
          vwap_distance: number | null
        }
        Insert: {
          atr_14?: number | null
          breakout_strength?: number | null
          candle_body?: number | null
          created_at?: string
          feature_set_version: string
          features_json?: Json | null
          id?: string
          instrument_id: string
          lower_wick?: number | null
          macd_line?: number | null
          macd_signal?: number | null
          momentum_10?: number | null
          momentum_3?: number | null
          momentum_5?: number | null
          opening_range_position?: number | null
          pullback_strength?: number | null
          range_points?: number | null
          rsi_14?: number | null
          session_phase?:
            | Database["public"]["Enums"]["session_phase_enum"]
            | null
          timeframe: string
          trend_strength?: number | null
          ts_reference: string
          upper_wick?: number | null
          volatility_regime?: number | null
          volume_zscore?: number | null
          vwap?: number | null
          vwap_distance?: number | null
        }
        Update: {
          atr_14?: number | null
          breakout_strength?: number | null
          candle_body?: number | null
          created_at?: string
          feature_set_version?: string
          features_json?: Json | null
          id?: string
          instrument_id?: string
          lower_wick?: number | null
          macd_line?: number | null
          macd_signal?: number | null
          momentum_10?: number | null
          momentum_3?: number | null
          momentum_5?: number | null
          opening_range_position?: number | null
          pullback_strength?: number | null
          range_points?: number | null
          rsi_14?: number | null
          session_phase?:
            | Database["public"]["Enums"]["session_phase_enum"]
            | null
          timeframe?: string
          trend_strength?: number | null
          ts_reference?: string
          upper_wick?: number | null
          volatility_regime?: number | null
          volume_zscore?: number | null
          vwap?: number | null
          vwap_distance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_vectors_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      instruments: {
        Row: {
          asset_class: string
          base_symbol: string
          contract_multiplier: number
          created_at: string
          currency: string
          exchange: string
          id: string
          is_active: boolean
          symbol: string
          tick_size: number
          tick_value: number
        }
        Insert: {
          asset_class?: string
          base_symbol: string
          contract_multiplier?: number
          created_at?: string
          currency?: string
          exchange?: string
          id?: string
          is_active?: boolean
          symbol: string
          tick_size: number
          tick_value: number
        }
        Update: {
          asset_class?: string
          base_symbol?: string
          contract_multiplier?: number
          created_at?: string
          currency?: string
          exchange?: string
          id?: string
          is_active?: boolean
          symbol?: string
          tick_size?: number
          tick_value?: number
        }
        Relationships: []
      }
      market_candles: {
        Row: {
          close: number
          created_at: string
          high: number
          id: string
          instrument_id: string
          low: number
          open: number
          source: string
          timeframe: string
          trade_count: number | null
          ts_close: string
          ts_open: string
          volume: number | null
          vwap: number | null
        }
        Insert: {
          close: number
          created_at?: string
          high: number
          id?: string
          instrument_id: string
          low: number
          open: number
          source?: string
          timeframe: string
          trade_count?: number | null
          ts_close: string
          ts_open: string
          volume?: number | null
          vwap?: number | null
        }
        Update: {
          close?: number
          created_at?: string
          high?: number
          id?: string
          instrument_id?: string
          low?: number
          open?: number
          source?: string
          timeframe?: string
          trade_count?: number | null
          ts_close?: string
          ts_open?: string
          volume?: number | null
          vwap?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "market_candles_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      market_regimes: {
        Row: {
          confidence: number
          created_at: string
          feature_vector_id: string | null
          id: string
          instrument_id: string
          model_version: string | null
          rationale: string | null
          regime_label: Database["public"]["Enums"]["market_regime_enum"]
          ts_reference: string
        }
        Insert: {
          confidence: number
          created_at?: string
          feature_vector_id?: string | null
          id?: string
          instrument_id: string
          model_version?: string | null
          rationale?: string | null
          regime_label: Database["public"]["Enums"]["market_regime_enum"]
          ts_reference: string
        }
        Update: {
          confidence?: number
          created_at?: string
          feature_vector_id?: string | null
          id?: string
          instrument_id?: string
          model_version?: string | null
          rationale?: string | null
          regime_label?: Database["public"]["Enums"]["market_regime_enum"]
          ts_reference?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_regimes_feature_vector_id_fkey"
            columns: ["feature_vector_id"]
            isOneToOne: false
            referencedRelation: "feature_vectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_regimes_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      market_sessions: {
        Row: {
          close_time: string | null
          created_at: string
          id: string
          instrument_id: string
          open_time: string | null
          session_date: string
          session_type: string
          status: string
        }
        Insert: {
          close_time?: string | null
          created_at?: string
          id?: string
          instrument_id: string
          open_time?: string | null
          session_date: string
          session_type?: string
          status?: string
        }
        Update: {
          close_time?: string | null
          created_at?: string
          id?: string
          instrument_id?: string
          open_time?: string | null
          session_date?: string
          session_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_sessions_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      market_snapshots: {
        Row: {
          agg_volume: number | null
          ask: number | null
          bid: number | null
          buy_pressure: number | null
          created_at: string
          id: string
          imbalance: number | null
          instrument_id: string
          last_price: number
          microtrend: number | null
          mid_price: number | null
          raw_payload: Json | null
          sell_pressure: number | null
          source: string
          spread: number | null
          ts_event: string
        }
        Insert: {
          agg_volume?: number | null
          ask?: number | null
          bid?: number | null
          buy_pressure?: number | null
          created_at?: string
          id?: string
          imbalance?: number | null
          instrument_id: string
          last_price: number
          microtrend?: number | null
          mid_price?: number | null
          raw_payload?: Json | null
          sell_pressure?: number | null
          source?: string
          spread?: number | null
          ts_event: string
        }
        Update: {
          agg_volume?: number | null
          ask?: number | null
          bid?: number | null
          buy_pressure?: number | null
          created_at?: string
          id?: string
          imbalance?: number | null
          instrument_id?: string
          last_price?: number
          microtrend?: number | null
          mid_price?: number | null
          raw_payload?: Json | null
          sell_pressure?: number | null
          source?: string
          spread?: number | null
          ts_event?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_snapshots_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_datasets: {
        Row: {
          created_at: string
          dataset_name: string
          dataset_type: string
          date_end: string | null
          date_start: string | null
          feature_set_version: string | null
          id: string
          row_count: number | null
          storage_ref: string | null
          strategy_version: string | null
          symbol: string | null
          target_definition: string | null
          timeframe: string | null
        }
        Insert: {
          created_at?: string
          dataset_name: string
          dataset_type: string
          date_end?: string | null
          date_start?: string | null
          feature_set_version?: string | null
          id?: string
          row_count?: number | null
          storage_ref?: string | null
          strategy_version?: string | null
          symbol?: string | null
          target_definition?: string | null
          timeframe?: string | null
        }
        Update: {
          created_at?: string
          dataset_name?: string
          dataset_type?: string
          date_end?: string | null
          date_start?: string | null
          feature_set_version?: string | null
          id?: string
          row_count?: number | null
          storage_ref?: string | null
          strategy_version?: string | null
          symbol?: string | null
          target_definition?: string | null
          timeframe?: string | null
        }
        Relationships: []
      }
      ml_models: {
        Row: {
          artifact_ref: string | null
          created_at: string
          feature_set_version: string | null
          id: string
          is_active: boolean
          metrics_json: Json | null
          model_name: string
          model_type: string
          model_version: string
          symbol: string | null
          timeframe: string | null
          training_dataset_id: string | null
        }
        Insert: {
          artifact_ref?: string | null
          created_at?: string
          feature_set_version?: string | null
          id?: string
          is_active?: boolean
          metrics_json?: Json | null
          model_name: string
          model_type: string
          model_version: string
          symbol?: string | null
          timeframe?: string | null
          training_dataset_id?: string | null
        }
        Update: {
          artifact_ref?: string | null
          created_at?: string
          feature_set_version?: string | null
          id?: string
          is_active?: boolean
          metrics_json?: Json | null
          model_name?: string
          model_type?: string
          model_version?: string
          symbol?: string | null
          timeframe?: string | null
          training_dataset_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_models_training_dataset_id_fkey"
            columns: ["training_dataset_id"]
            isOneToOne: false
            referencedRelation: "ml_datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      position_snapshots: {
        Row: {
          avg_price: number | null
          created_at: string
          environment: Database["public"]["Enums"]["env_mode"]
          id: string
          instrument_id: string
          net_quantity: number
          raw_payload: Json | null
          realized_pnl_brl: number | null
          ts_event: string
          unrealized_pnl_brl: number | null
        }
        Insert: {
          avg_price?: number | null
          created_at?: string
          environment: Database["public"]["Enums"]["env_mode"]
          id?: string
          instrument_id: string
          net_quantity?: number
          raw_payload?: Json | null
          realized_pnl_brl?: number | null
          ts_event: string
          unrealized_pnl_brl?: number | null
        }
        Update: {
          avg_price?: number | null
          created_at?: string
          environment?: Database["public"]["Enums"]["env_mode"]
          id?: string
          instrument_id?: string
          net_quantity?: number
          raw_payload?: Json | null
          realized_pnl_brl?: number | null
          ts_event?: string
          unrealized_pnl_brl?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "position_snapshots_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_meta: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      signal_feedback: {
        Row: {
          created_at: string
          created_by: string | null
          direction_quality: number | null
          exit_quality: number | null
          feedback_label: Database["public"]["Enums"]["feedback_label_enum"]
          feedback_score: Database["public"]["Enums"]["feedback_score_enum"]
          id: string
          risk_quality: number | null
          signal_id: string
          timing_quality: number | null
          user_comment: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          direction_quality?: number | null
          exit_quality?: number | null
          feedback_label: Database["public"]["Enums"]["feedback_label_enum"]
          feedback_score: Database["public"]["Enums"]["feedback_score_enum"]
          id?: string
          risk_quality?: number | null
          signal_id: string
          timing_quality?: number | null
          user_comment?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          direction_quality?: number | null
          exit_quality?: number | null
          feedback_label?: Database["public"]["Enums"]["feedback_label_enum"]
          feedback_score?: Database["public"]["Enums"]["feedback_score_enum"]
          id?: string
          risk_quality?: number | null
          signal_id?: string
          timing_quality?: number | null
          user_comment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signal_feedback_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "ai_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_learning_scores: {
        Row: {
          created_at: string
          execution_score: number | null
          final_score: number | null
          human_score: number | null
          id: string
          outcome_score: number | null
          score_formula_version: string
          signal_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          execution_score?: number | null
          final_score?: number | null
          human_score?: number | null
          id?: string
          outcome_score?: number | null
          score_formula_version: string
          signal_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          execution_score?: number | null
          final_score?: number | null
          human_score?: number | null
          id?: string
          outcome_score?: number | null
          score_formula_version?: string
          signal_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_learning_scores_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: true
            referencedRelation: "ai_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_outcomes: {
        Row: {
          close_after_horizon: number | null
          created_at: string
          horizon_minutes: number
          id: string
          max_adverse_excursion: number | null
          max_favorable_excursion: number | null
          outcome_label: Database["public"]["Enums"]["outcome_label_enum"]
          outcome_score: number | null
          signal_id: string
        }
        Insert: {
          close_after_horizon?: number | null
          created_at?: string
          horizon_minutes: number
          id?: string
          max_adverse_excursion?: number | null
          max_favorable_excursion?: number | null
          outcome_label: Database["public"]["Enums"]["outcome_label_enum"]
          outcome_score?: number | null
          signal_id: string
        }
        Update: {
          close_after_horizon?: number | null
          created_at?: string
          horizon_minutes?: number
          id?: string
          max_adverse_excursion?: number | null
          max_favorable_excursion?: number | null
          outcome_label?: Database["public"]["Enums"]["outcome_label_enum"]
          outcome_score?: number | null
          signal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_outcomes_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: true
            referencedRelation: "ai_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      system_configs: {
        Row: {
          config_key: string
          description: string | null
          environment: Database["public"]["Enums"]["env_mode"]
          id: string
          updated_at: string
          value_json: Json
        }
        Insert: {
          config_key: string
          description?: string | null
          environment: Database["public"]["Enums"]["env_mode"]
          id?: string
          updated_at?: string
          value_json: Json
        }
        Update: {
          config_key?: string
          description?: string | null
          environment?: Database["public"]["Enums"]["env_mode"]
          id?: string
          updated_at?: string
          value_json?: Json
        }
        Relationships: []
      }
      system_events: {
        Row: {
          created_at: string
          environment: Database["public"]["Enums"]["env_mode"] | null
          event_type: string
          id: string
          message: string
          payload_json: Json | null
          reference_id: string | null
          severity: string
        }
        Insert: {
          created_at?: string
          environment?: Database["public"]["Enums"]["env_mode"] | null
          event_type: string
          id?: string
          message: string
          payload_json?: Json | null
          reference_id?: string | null
          severity?: string
        }
        Update: {
          created_at?: string
          environment?: Database["public"]["Enums"]["env_mode"] | null
          event_type?: string
          id?: string
          message?: string
          payload_json?: Json | null
          reference_id?: string | null
          severity?: string
        }
        Relationships: []
      }
      trade_orders: {
        Row: {
          broker_env: Database["public"]["Enums"]["env_mode"]
          close_price: number | null
          closed_at: string | null
          command_id: string | null
          created_at: string
          executed_at: string | null
          executed_price: number | null
          execution_notes: string | null
          fees_brl: number | null
          gross_pnl_brl: number | null
          gross_pnl_points: number | null
          id: string
          instrument_id: string
          mt5_ticket: string | null
          net_pnl_brl: number | null
          order_side: Database["public"]["Enums"]["order_side_enum"]
          order_type: Database["public"]["Enums"]["order_type_enum"]
          quantity: number
          requested_price: number | null
          sent_at: string | null
          signal_id: string | null
          slippage_points: number | null
          status: Database["public"]["Enums"]["execution_status_enum"]
          stop_price: number | null
          take_price: number | null
        }
        Insert: {
          broker_env: Database["public"]["Enums"]["env_mode"]
          close_price?: number | null
          closed_at?: string | null
          command_id?: string | null
          created_at?: string
          executed_at?: string | null
          executed_price?: number | null
          execution_notes?: string | null
          fees_brl?: number | null
          gross_pnl_brl?: number | null
          gross_pnl_points?: number | null
          id?: string
          instrument_id: string
          mt5_ticket?: string | null
          net_pnl_brl?: number | null
          order_side: Database["public"]["Enums"]["order_side_enum"]
          order_type: Database["public"]["Enums"]["order_type_enum"]
          quantity: number
          requested_price?: number | null
          sent_at?: string | null
          signal_id?: string | null
          slippage_points?: number | null
          status?: Database["public"]["Enums"]["execution_status_enum"]
          stop_price?: number | null
          take_price?: number | null
        }
        Update: {
          broker_env?: Database["public"]["Enums"]["env_mode"]
          close_price?: number | null
          closed_at?: string | null
          command_id?: string | null
          created_at?: string
          executed_at?: string | null
          executed_price?: number | null
          execution_notes?: string | null
          fees_brl?: number | null
          gross_pnl_brl?: number | null
          gross_pnl_points?: number | null
          id?: string
          instrument_id?: string
          mt5_ticket?: string | null
          net_pnl_brl?: number | null
          order_side?: Database["public"]["Enums"]["order_side_enum"]
          order_type?: Database["public"]["Enums"]["order_type_enum"]
          quantity?: number
          requested_price?: number | null
          sent_at?: string | null
          signal_id?: string | null
          slippage_points?: number | null
          status?: Database["public"]["Enums"]["execution_status_enum"]
          stop_price?: number | null
          take_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_orders_command_id_fkey"
            columns: ["command_id"]
            isOneToOne: false
            referencedRelation: "execution_commands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_orders_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_orders_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "ai_signals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      entry_type_enum: "market" | "limit" | "stop" | "none"
      env_mode: "replay" | "backtest" | "paper" | "live"
      execution_status_enum:
        | "pending"
        | "approved"
        | "rejected"
        | "sent"
        | "filled"
        | "partial"
        | "cancelled"
        | "closed"
        | "error"
      feedback_label_enum: "excelente" | "boa" | "ruim"
      feedback_score_enum: "+2" | "+1" | "-1"
      market_regime_enum:
        | "trend_up"
        | "trend_down"
        | "range"
        | "breakout_up"
        | "breakout_down"
        | "reversal_up"
        | "reversal_down"
        | "indecision"
      order_side_enum: "buy" | "sell"
      order_type_enum: "market" | "limit" | "stop" | "close"
      outcome_label_enum:
        | "hit_target"
        | "stopped"
        | "partial"
        | "breakeven"
        | "no_followthrough"
        | "open"
        | "manual_close"
      session_phase_enum:
        | "pre_market"
        | "opening"
        | "morning"
        | "midday"
        | "afternoon"
        | "closing"
        | "after_market"
      signal_side: "buy" | "sell" | "neutral"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      entry_type_enum: ["market", "limit", "stop", "none"],
      env_mode: ["replay", "backtest", "paper", "live"],
      execution_status_enum: [
        "pending",
        "approved",
        "rejected",
        "sent",
        "filled",
        "partial",
        "cancelled",
        "closed",
        "error",
      ],
      feedback_label_enum: ["excelente", "boa", "ruim"],
      feedback_score_enum: ["+2", "+1", "-1"],
      market_regime_enum: [
        "trend_up",
        "trend_down",
        "range",
        "breakout_up",
        "breakout_down",
        "reversal_up",
        "reversal_down",
        "indecision",
      ],
      order_side_enum: ["buy", "sell"],
      order_type_enum: ["market", "limit", "stop", "close"],
      outcome_label_enum: [
        "hit_target",
        "stopped",
        "partial",
        "breakeven",
        "no_followthrough",
        "open",
        "manual_close",
      ],
      session_phase_enum: [
        "pre_market",
        "opening",
        "morning",
        "midday",
        "afternoon",
        "closing",
        "after_market",
      ],
      signal_side: ["buy", "sell", "neutral"],
    },
  },
} as const
