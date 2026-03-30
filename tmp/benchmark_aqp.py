import pandas as pd
import numpy as np
import time

def benchmark(n):
    df = pd.DataFrame({'val': np.random.rand(n)})
    
    # Exact
    start = time.perf_counter()
    exact = df['val'].sum()
    exact_time = time.perf_counter() - start
    
    # Random 10%
    start = time.perf_counter()
    sample_random = df['val'].sample(frac=0.1)
    approx_random = sample_random.sum() / 0.1
    approx_random_time = time.perf_counter() - start
    
    # Systematic 10% (taking every 10th row)
    start = time.perf_counter()
    sample_systematic = df['val'].iloc[::10]
    approx_sys = sample_systematic.sum() / 0.1
    approx_sys_time = time.perf_counter() - start
    
    return exact_time, approx_random_time, approx_sys_time

sizes = [10_000, 50_000, 100_000, 500_000, 1_000_000, 5_000_000]
print(f"{'Size':>10} | {'Exact (ms)':>10} | {'Random (ms)':>12} | {'Systematic (ms)':>15} | {'Speedup'}")
print("-" * 75)
for s in sizes:
    e, r, s_time = benchmark(s)
    speedup = e / s_time
    print(f"{s:10,d} | {e*1000:10.2f} | {r*1000:12.2f} | {s_time*1000:15.2f} | {speedup:8.2f}x")
