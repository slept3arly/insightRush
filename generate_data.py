import pandas as pd
import numpy as np
import os

filename = 'test_data_10m.csv'
n_total = 100_000_000
chunk_size = 10_000_000  # Process 1 million rows at a time

for i in range(0, n_total, chunk_size):
    df = pd.DataFrame({
        'category': np.random.choice(['A', 'B', 'C', 'D', 'E'], chunk_size),
        'sub_category': np.random.randint(1, 100, chunk_size),
        'value': np.random.normal(100, 20, chunk_size)
    })
    
    # Header only for the first chunk
    mode = 'w' if i == 0 else 'a'
    header = True if i == 0 else False
    
    df.to_csv(filename, mode=mode, index=False, header=header)
    print(f"Finished writing {i + chunk_size} rows...")