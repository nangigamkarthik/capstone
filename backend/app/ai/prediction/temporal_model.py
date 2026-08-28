"""
Predictive Analytics — Temporal LSTM Forecaster

Simulates a temporal sequence predictor (LSTM) that forecasts future student
attention and engagement levels based on a sliding window of past metrics.
"""
import numpy as np
from typing import List, Tuple

class TemporalForecaster:
    """
    Simulates a sequence-to-sequence model (LSTM) that takes a time-series
    of past engagement/attention metrics and forecasts the values for
    the next N minutes (e.g. 5, 10, 15 minutes).
    
    Used to pre-emptively warn teachers about impending engagement drops.
    """
    
    def __init__(self, lookback_window: int = 60, forecast_horizon: int = 15):
        self.lookback_window = lookback_window
        self.forecast_horizon = forecast_horizon
        
        # Simple simulated autoregressive parameters
        rng = np.random.RandomState(101)
        self.weights = rng.uniform(0.8, 0.95, lookback_window)
        # Normalize weights to sum to ~0.9 (damping factor)
        self.weights = 0.9 * self.weights / self.weights.sum()

    def forecast(self, history: List[float]) -> List[float]:
        """
        Predict future engagement values.
        
        Args:
            history: List of past float metrics (length up to lookback_window)
            
        Returns:
            List of forecasted values (length = forecast_horizon)
        """
        if not history:
            return [50.0] * self.forecast_horizon
            
        # Pad or slice history to match lookback window
        if len(history) < self.lookback_window:
            # Pad with the earliest value
            padded = [history[0]] * (self.lookback_window - len(history)) + list(history)
        else:
            padded = list(history[-self.lookback_window:])
            
        seq = np.array(padded, dtype=np.float32)
        predictions = []
        
        # Multistep ahead autoregressive simulation
        for _ in range(self.forecast_horizon):
            # Compute weighted prediction + small random walk noise
            next_val = float(np.dot(seq, self.weights) + (seq[-1] * 0.1))
            # Add minor damping noise to prevent explosion/extinction
            next_val = np.clip(next_val + np.random.normal(0, 1.0), 0.0, 100.0)
            predictions.append(float(next_val))
            
            # Roll sequence
            seq = np.append(seq[1:], [next_val])
            
        return predictions
