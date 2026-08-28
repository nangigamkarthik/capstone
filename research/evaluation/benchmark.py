"""
Research Evaluation — Model Performance & Latency Benchmarks

Measures processing speed, frames-per-second (FPS), memory footprint,
and GPU/CPU latency statistics across different pipeline modules.
"""
import time
import numpy as np
from typing import Callable, Dict, List
from loguru import logger

class PipelineBenchmarker:
    """
    Measures processing speed, latency percentiles, and hardware constraints.
    """

    @staticmethod
    def benchmark_module(
        module_func: Callable,
        dummy_inputs: List,
        num_runs: int = 100,
        warmup_runs: int = 10,
    ) -> Dict[str, float]:
        """
        Run latency benchmark on a target module function.
        """
        # Warmup loop
        for _ in range(warmup_runs):
            module_func(*dummy_inputs)
            
        latencies = []
        
        # Benchmark loop
        for _ in range(num_runs):
            t0 = time.perf_counter()
            module_func(*dummy_inputs)
            t1 = time.perf_counter()
            latencies.append((t1 - t0) * 1000)  # ms
            
        lat_arr = np.array(latencies)
        
        mean_lat = float(np.mean(lat_arr))
        median_lat = float(np.median(lat_arr))
        p95_lat = float(np.percentile(lat_arr, 95))
        p99_lat = float(np.percentile(lat_arr, 99))
        fps = 1000.0 / mean_lat if mean_lat > 0 else 0.0
        
        return {
            "mean_latency_ms": round(mean_lat, 2),
            "median_latency_ms": round(median_lat, 2),
            "p95_latency_ms": round(p95_lat, 2),
            "p99_latency_ms": round(p99_lat, 2),
            "fps": round(fps, 1),
            "total_runs": num_runs
        }
